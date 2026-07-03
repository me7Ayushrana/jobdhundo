import { NextRequest, NextResponse } from "next/server";
import { fetchAdzunaJobs } from "@/lib/jobs/aggregators/adzuna";
import { fetchLoopCVJobs } from "@/lib/jobs/aggregators/loopcv";
import { fetchJSearchJobs } from "@/lib/jobs/aggregators/jsearch";
import { getCacheKey, getCachedJobs, saveJobsToCache, getStaleJobs } from "@/lib/jobs/cache";
import { UnifiedJob, JobSearchResult } from "@/lib/jobs/types";
import { HIGH_FIDELITY_FALLBACK_JOBS } from "@/lib/jobs/mock-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const location = searchParams.get("location") || "";
    const jobTypes = searchParams.get("jobType") ? searchParams.get("jobType")!.split(",") : [];
    const experience = searchParams.get("experience") ? searchParams.get("experience")!.split(",") : [];
    const skills = searchParams.get("skills") ? searchParams.get("skills")!.split(",") : [];
    const salaryMin = searchParams.get("salaryMin") ? parseInt(searchParams.get("salaryMin")!, 10) : undefined;
    const salaryMax = searchParams.get("salaryMax") ? parseInt(searchParams.get("salaryMax")!, 10) : undefined;
    const remote = searchParams.get("remote") === "true";
    const postedWithin = searchParams.get("postedWithin") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "10", 10);

    const filters = {
      q,
      location,
      jobTypes,
      experience,
      skills,
      salaryMin,
      salaryMax,
      remote,
      postedWithin,
      page,
      perPage
    };

    const cacheKey = getCacheKey(filters);

    // 1. Try to read active cache
    const cachedResult = await getCachedJobs(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // 2. Fetch from Live APIs in parallel (wrapped in safe catch)
    console.log("[API Route] Cache miss. Fetching live API listings...");
    const [adzunaJobs, loopcvJobs, jsearchJobs] = await Promise.all([
      fetchAdzunaJobs(q || "software", location, page).catch((e) => {
        console.error("Adzuna fetch failed:", e);
        return [];
      }),
      fetchLoopCVJobs(q || "software", location).catch((e) => {
        console.error("LoopCV fetch failed:", e);
        return [];
      }),
      fetchJSearchJobs(q || "software", location, page).catch((e) => {
        console.error("JSearch fetch failed:", e);
        return [];
      })
    ]);

    let rawAggregated = [...adzunaJobs, ...loopcvJobs, ...jsearchJobs];

    // Deduplicate jobs by Title + Company + Location
    const seen = new Set<string>();
    let deduped = rawAggregated.filter((job) => {
      const hash = `${job.title.toLowerCase()}|${job.company.toLowerCase()}|${job.location.toLowerCase()}`;
      if (seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });

    // ALWAYS include Internshala and Naukri listings so they are always available and filterable!
    const curatedSourceJobs = HIGH_FIDELITY_FALLBACK_JOBS.filter(
      (job) => job.source === "internshala" || job.source === "naukri"
    );
    const dedupedCurated = curatedSourceJobs.filter((job) => {
      const hash = `${job.title.toLowerCase()}|${job.company.toLowerCase()}|${job.location.toLowerCase()}`;
      if (seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });
    
    deduped = [...deduped, ...dedupedCurated];

    // Fallback: If we got 0 results (e.g. empty), use the full curated database
    if (deduped.length === 0) {
      console.log("[API Route] No live results, using Curated mock database.");
      // Apply basic keywords text filter on mock listings
      deduped = HIGH_FIDELITY_FALLBACK_JOBS.filter(job => {
        if (!q) return true;
        const term = q.toLowerCase();
        return (
          job.title.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term) ||
          job.skills.some(s => s.toLowerCase().includes(term))
        );
      });
    }

    // 3. Apply exact Filters
    let filteredJobs = [...deduped];

    // Job Types filter
    if (jobTypes.length > 0) {
      filteredJobs = filteredJobs.filter((job) => jobTypes.includes(job.jobType));
    }

    // Experience filter
    if (experience.length > 0) {
      filteredJobs = filteredJobs.filter((job) => experience.includes(job.experienceLevel));
    }

    // Remote filter
    if (remote) {
      filteredJobs = filteredJobs.filter((job) => job.location.toLowerCase().includes("remote"));
    }

    // Skills filter
    if (skills.length > 0) {
      filteredJobs = filteredJobs.filter((job) =>
        skills.some((s) => job.skills.map((js) => js.toLowerCase()).includes(s.toLowerCase()))
      );
    }

    // Salary Min/Max Filter
    if (salaryMin !== undefined) {
      filteredJobs = filteredJobs.filter((job) => !job.salaryMin || job.salaryMin >= salaryMin);
    }
    if (salaryMax !== undefined) {
      filteredJobs = filteredJobs.filter((job) => !job.salaryMax || job.salaryMax <= salaryMax);
    }

    // Recency (Posted Within) Filter
    if (postedWithin !== "all") {
      const now = Date.now();
      let limitMs = 30 * 24 * 60 * 60 * 1000; // default 30d
      if (postedWithin === "24h") limitMs = 24 * 60 * 60 * 1000;
      if (postedWithin === "7d") limitMs = 7 * 24 * 60 * 60 * 1000;

      filteredJobs = filteredJobs.filter(
        (job) => now - new Date(job.postedDate).getTime() <= limitMs
      );
    }

    // Sort by postedDate descending
    filteredJobs.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());

    // Calculate source breakdowns
    const sourceBreakdown: Record<string, number> = {};
    deduped.forEach((job) => {
      sourceBreakdown[job.source] = (sourceBreakdown[job.source] || 0) + 1;
    });

    // Paginate
    const totalResults = filteredJobs.length;
    const startIndex = (page - 1) * perPage;
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + perPage);
    const hasMore = startIndex + perPage < totalResults;

    const result: JobSearchResult = {
      jobs: paginatedJobs,
      totalResults,
      page,
      perPage,
      hasMore,
      sourceBreakdown,
      cached: false,
      fetchedAt: new Date().toISOString()
    };

    // Store in cache (10 minutes TTL)
    if (totalResults > 0) {
      await saveJobsToCache(cacheKey, result);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API GET Jobs] Endpoint crashed:", error);
    // Serve stale cache fallback
    try {
      const { searchParams } = new URL(req.url);
      const q = searchParams.get("q") || "";
      const cacheKey = getCacheKey({ q });
      const stale = await getStaleJobs(cacheKey);
      if (stale) {
        return NextResponse.json({ ...stale, cached: true, warning: "Served from offline backup." });
      }
    } catch (_) {}

    return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 });
  }
}
