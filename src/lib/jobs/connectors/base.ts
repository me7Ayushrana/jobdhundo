import { UnifiedJob } from "../types";
import { fetchJSearchJobs } from "../aggregators/jsearch";

/**
 * Executes an async task with exponential backoff retries.
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`[Sync Pipeline] Fetch failed. Retrying in ${delayMs}ms... (Retries left: ${retries})`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fetchWithRetry(fn, retries - 1, delayMs * 2);
  }
}

/**
 * Clean HTML strings and decode basic XML codes
 */
export function cleanText(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Standard live fetch router that target search indexes for a specific portal domain name.
 */
export async function fetchSiteIndexedJobs(
  domain: string,
  query: string,
  location: string,
  sourceId: string,
  sourceName: string
): Promise<UnifiedJob[]> {
  const hasApiKey = !!(process.env.RAPIDAPI_KEY || process.env.JSEARCH_RAPIDAPI_KEY);
  if (!hasApiKey) {
    return []; // Return empty list, triggering connector to serve its local high-fidelity fallback list
  }

  return fetchWithRetry(async () => {
    // target search strictly for this specific portal site domain
    const targetQuery = `site:${domain} ${query}`;
    console.log(`[Connector: ${sourceName}] Running live crawler query: "${targetQuery}" in "${location}"`);
    const jobs = await fetchJSearchJobs(targetQuery, location, 1);
    
    // Normalize properties to fit this connector brand
    return jobs.map(job => ({
      ...job,
      source: sourceId,
      sourceAttribution: `via ${sourceName}`,
      lastUpdated: new Date().toISOString()
    }));
  });
}
