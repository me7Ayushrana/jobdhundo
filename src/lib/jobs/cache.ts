import { db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { JobSearchResult } from "./types";

interface MemoryCacheEntry {
  data: JobSearchResult;
  timestamp: number;
  ttl: number; // in milliseconds
}

const memoryCache = new Map<string, MemoryCacheEntry>();

export function getCacheKey(filters: any): string {
  // MUST include jobType so different filters get different cache entries
  const sortedFilters = Object.keys(filters)
    .sort()
    .reduce((acc: any, key) => {
      acc[key] = filters[key];
      return acc;
    }, {});
  
  const jsonStr = JSON.stringify(sortedFilters);
  
  if (typeof window === 'undefined') {
    return Buffer.from(jsonStr).toString('base64').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 100);
  } else {
    try {
      return btoa(jsonStr).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 100);
    } catch (e) {
      return jsonStr.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 100);
    }
  }
}

export async function getCachedJobs(key: string): Promise<JobSearchResult | null> {
  const now = Date.now();

  // 1. Check memory cache
  const memEntry = memoryCache.get(key);
  if (memEntry) {
    if (now - memEntry.timestamp < memEntry.ttl) {
      console.log("[Cache] Memory cache hit");
      return { ...memEntry.data, cached: true };
    }
  }

  // 2. Check Firestore cache
  if (db) {
    try {
      const docRef = doc(db, "job_cache", key);
      
      // Wrap getDoc in a 1.5-second timeout to prevent API hangs on database issues
      const docSnap = await Promise.race([
        getDoc(docRef),
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout waiting for Firestore")), 1500)
        )
      ]);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const expiresAt = data.expiresAt;
        const result = data.result ? JSON.parse(data.result) : null;
        
        if (result && expiresAt && now < expiresAt) {
          console.log("[Cache] Firestore cache hit");
          
          // Update memory cache
          memoryCache.set(key, {
            data: result,
            timestamp: data.fetchedAt || now,
            ttl: expiresAt - now
          });
          
          return { ...result, cached: true };
        }
      }
    } catch (e) {
      console.warn("[Cache] Firestore read error:", e);
    }
  }

  return null;
}

export async function getStaleJobs(key: string): Promise<JobSearchResult | null> {
  // Check memory first
  const memEntry = memoryCache.get(key);
  if (memEntry) {
    return { ...memEntry.data, cached: true };
  }

  // Check Firestore next
  if (db) {
    try {
      const docRef = doc(db, "job_cache", key);
      
      // Wrap getDoc in a 1.5-second timeout to prevent API hangs on database issues
      const docSnap = await Promise.race([
        getDoc(docRef),
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout waiting for Firestore")), 1500)
        )
      ]);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const result = data.result ? JSON.parse(data.result) : null;
        if (result) {
          return { ...result, cached: true };
        }
      }
    } catch (e) {
      console.warn("[Cache] Firestore stale read error:", e);
    }
  }

  return null;
}

export async function saveJobsToCache(
  key: string,
  data: JobSearchResult,
  ttlMs: number = 10 * 60 * 1000
): Promise<void> {
  const now = Date.now();
  const expiresAt = now + ttlMs;

  // 1. Save to memory Map
  memoryCache.set(key, {
    data,
    timestamp: now,
    ttl: ttlMs
  });

  // 2. Save to Firestore asynchronously in background (no await to prevent endpoint hangs)
  if (db) {
    try {
      const docRef = doc(db, "job_cache", key);
      setDoc(docRef, {
        result: JSON.stringify(data),
        fetchedAt: now,
        expiresAt: expiresAt
      }).then(() => {
        console.log("[Cache] Saved results to Firestore");
      }).catch((e) => {
        console.warn("[Cache] Firestore write error in background:", e);
      });
    } catch (e) {
      console.warn("[Cache] Firestore write setup error:", e);
    }
  }
}

export function findJobInMemoryCache(id: string): any | null {
  for (const entry of memoryCache.values()) {
    if (entry.data && entry.data.jobs) {
      const found = entry.data.jobs.find((j: any) => j.id === id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
