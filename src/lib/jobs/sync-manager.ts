import { db } from "../firebase/config";
import { UnifiedJob } from "./types";
import { REGISTERED_CONNECTORS } from "./connectors";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Local database JSON path for local fallback persistence
const LOCAL_DB_PATH = path.join(process.cwd(), "src/lib/jobs/synced_database.json");

/**
 * Normalizes strings to create a unique identifier for duplicate detection.
 */
export function generateDedupeHash(company: string, title: string, location: string): string {
  const c = (company || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const t = (title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const l = (location || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${c}-${t}-${l}`;
}

/**
 * Loads all jobs from the active database (Firestore or Local JSON file fallback).
 */
export async function loadAllJobsFromDb(): Promise<UnifiedJob[]> {
  // 1. Try Firestore if configured
  if (db) {
    try {
      console.log("[SyncManager] Querying jobs from Cloud Firestore...");
      const snapshot = await getDocs(collection(db, "jobs"));
      const list: UnifiedJob[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as UnifiedJob);
      });
      return list;
    } catch (e) {
      console.error("[SyncManager] Firestore query failed, falling back to JSON:", e);
    }
  }

  // 2. Fallback to Local JSON Database
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
      return JSON.parse(raw) as UnifiedJob[];
    }
  } catch (err) {
    console.error("[SyncManager] Failed to read local JSON database:", err);
  }

  return [];
}

/**
 * Saves the unified jobs collection to the active database.
 */
export async function saveJobToDb(job: UnifiedJob): Promise<void> {
  // 1. Save to Firestore if active
  if (db) {
    try {
      const docRef = doc(db, "jobs", job.id);
      await setDoc(docRef, job, { merge: true });
      return;
    } catch (e) {
      console.error(`[SyncManager] Firestore write failed for ${job.id}:`, e);
    }
  }

  // File system writes are handled in batch for the local JSON database to prevent concurrent write corruptions.
}

export async function saveAllJobsToJsonDb(jobs: UnifiedJob[]): Promise<void> {
  try {
    // Ensure parent directory exists
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(jobs, null, 2), "utf-8");
    console.log(`[SyncManager] Local JSON Database updated successfully with ${jobs.length} jobs.`);
  } catch (err) {
    console.error("[SyncManager] Failed to write local JSON database:", err);
  }
}

export class SyncManager {
  /**
   * Runs the sync pipeline across all 12 registered portals.
   */
  static async runSync(query: string = "software developer", location: string = "India"): Promise<{
    processed: number;
    added: number;
    merged: number;
    removed: number;
    logs: string[];
  }> {
    const logs: string[] = [];
    logs.push(`[${new Date().toISOString()}] Launching Job Dhundo! Sync Pipeline...`);
    logs.push(`Query: "${query}" | Location: "${location}"`);

    // Load current database index
    const existingJobs = await loadAllJobsFromDb();
    const jobsMap = new Map<string, UnifiedJob>();
    existingJobs.forEach((job) => {
      jobsMap.set(job.id, job);
    });

    logs.push(`Loaded ${existingJobs.length} existing jobs from database.`);

    let addedCount = 0;
    let mergedCount = 0;
    let processedCount = 0;

    // Iterate through all 12 connectors
    for (const connector of REGISTERED_CONNECTORS) {
      try {
        logs.push(`[Connector: ${connector.name}] Fetching listings...`);
        const fetchedJobs = await connector.fetchJobs(query, location);
        logs.push(`[Connector: ${connector.name}] Discovered ${fetchedJobs.length} potential opportunities.`);

        for (const rawJob of fetchedJobs) {
          processedCount++;

          // 1. Validation Logic
          if (!rawJob.title || !rawJob.company || !rawJob.applyUrl) {
            logs.push(`⚠️ [Validation] Skipped invalid job from ${connector.name}: Missing Title, Company, or Apply Link.`);
            continue;
          }

          // 2. Create Unique Deduplication Hash
          const hashId = generateDedupeHash(rawJob.company, rawJob.title, rawJob.location);
          
          if (jobsMap.has(hashId)) {
            // DUPLICATE DETECTED! Run intelligent merge routine.
            const existing = jobsMap.get(hashId)!;
            
            // Merge alternate URL if it's new
            const altUrls = existing.alternateUrls || [];
            if (rawJob.applyUrl && existing.applyUrl !== rawJob.applyUrl && !altUrls.includes(rawJob.applyUrl)) {
              altUrls.push(rawJob.applyUrl);
            }

            // Merge alternate sources
            const altSources = existing.alternateSources || [];
            const sourceAttr = rawJob.sourceAttribution || `via ${connector.name}`;
            if (!altSources.includes(sourceAttr) && existing.sourceAttribution !== sourceAttr) {
              altSources.push(sourceAttr);
            }

            // Update parameters
            const mergedJob: UnifiedJob = {
              ...existing,
              alternateUrls: altUrls,
              alternateSources: altSources,
              lastUpdated: new Date().toISOString()
            };

            jobsMap.set(hashId, mergedJob);
            mergedCount++;
          } else {
            // NEW JOB! Create fresh database entry
            const newJob: UnifiedJob = {
              ...rawJob,
              id: hashId,
              alternateUrls: [rawJob.applyUrl],
              alternateSources: [rawJob.sourceAttribution || `via ${connector.name}`],
              lastUpdated: new Date().toISOString(),
              postedDate: rawJob.postedDate || new Date().toISOString()
            };

            jobsMap.set(hashId, newJob);
            addedCount++;
          }
        }
      } catch (err: any) {
        logs.push(`❌ [Connector: ${connector.name}] Failed: ${err.message || err}`);
      }
    }

    // 3. Clean up expired / stale listings
    const now = Date.now();
    const staleLimit = 30 * 24 * 60 * 60 * 1000; // 30 days
    let removedCount = 0;

    const allMergedList = Array.from(jobsMap.values());
    const finalActiveList = allMergedList.filter((job) => {
      const age = now - new Date(job.postedDate).getTime();
      const isExpired = age > staleLimit;
      if (isExpired) {
        removedCount++;
        logs.push(`🗑️ [Expiry] Removed stale job: "${job.title}" at "${job.company}" (older than 30 days)`);
        return false;
      }
      return true;
    });

    // 4. Save updates back to active database
    if (db) {
      logs.push(`[Database] Syncing ${finalActiveList.length} jobs to Cloud Firestore...`);
      for (const job of finalActiveList) {
        await saveJobToDb(job);
      }
    }

    // Always update the JSON backup database file for safety and local setups
    await saveAllJobsToJsonDb(finalActiveList);

    logs.push(`[Pipeline Success] Sync completed: Processed ${processedCount}, Added ${addedCount}, Merged ${mergedCount}, Expired ${removedCount}.`);
    
    return {
      processed: processedCount,
      added: addedCount,
      merged: mergedCount,
      removed: removedCount,
      logs
    };
  }
}
