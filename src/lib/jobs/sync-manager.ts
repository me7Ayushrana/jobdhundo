import { db } from "../firebase/config";
import { UnifiedJob } from "./types";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";

// Real API aggregators
import { fetchAdzunaJobs } from "./aggregators/adzuna";
import { fetchJSearchJobs } from "./aggregators/jsearch";
import { fetchLoopCVJobs } from "./aggregators/loopcv";
import { fetchRemoteOKJobs } from "./aggregators/remoteok";
import { fetchJobicyJobs } from "./aggregators/jobicy";
import { fetchGreenhouseJobs } from "./aggregators/greenhouse";
import { fetchLeverJobs } from "./aggregators/lever";
import { fetchAshbyJobs } from "./aggregators/ashby";

export function generateDedupeHash(company: string, title: string, location: string): string {
  const c = (company || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const t = (title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const l = (location || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${c}-${t}-${l}`;
}

export async function loadAllJobsFromDb(): Promise<UnifiedJob[]> {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, "jobs"));
    const list: UnifiedJob[] = [];
    snapshot.forEach((d) => list.push(d.data() as UnifiedJob));
    return list;
  } catch (e) {
    console.error("[SyncManager] Firestore error:", e);
    return [];
  }
}

export async function saveJobToDb(job: UnifiedJob): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, "jobs", job.id), job, { merge: true });
  } catch (e) {
    console.error(`[SyncManager] Save failed for ${job.id}:`, e);
  }
}

export class SyncManager {
  static async runSync(query: string = "software", location: string = "Remote"): Promise<any> {
    console.log(`[SyncManager] Starting live sync for "${query}" in ${location}...`);
    
        const results = await Promise.allSettled([
      ...(process.env.ADZUNA_APP_ID ? [fetchAdzunaJobs(query, location)] : []),
      ...(process.env.RAPIDAPI_KEY ? [fetchJSearchJobs(query, location)] : []),
      ...(process.env.LOOPCV_API_KEY ? [fetchLoopCVJobs(query, location)] : []),
      fetchRemoteOKJobs(query),
      fetchJobicyJobs(50, query),
      fetchGreenhouseJobs(),
      fetchLeverJobs(),
      fetchAshbyJobs()
    ]);

    const allJobs: UnifiedJob[] = [];
    const sources = ['adzuna', 'jsearch', 'loopcv', 'remoteok', 'jobicy', 'greenhouse', 'lever', 'ashby'];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allJobs.push(...result.value);
        console.log(`[SyncManager] ${sources[index]}: ${result.value.length} jobs`);
      }
    });

    // Deduplicate
    const seen = new Set<string>();
    const uniqueJobs = allJobs.filter(job => {
      const hash = generateDedupeHash(job.company, job.title, job.location);
      if (seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });

    // Save to Firestore
    for (const job of uniqueJobs) {
      await saveJobToDb(job);
    }

    return {
      totalJobs: uniqueJobs.length,
      timestamp: new Date().toISOString()
    };
  }
}
