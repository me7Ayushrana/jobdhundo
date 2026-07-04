import { NextRequest, NextResponse } from "next/server";
import { getCachedJobs, saveJobsToCache } from "@/lib/jobs/cache";
import { JobSearchResult } from "@/lib/jobs/types";
import { HIGH_FIDELITY_FALLBACK_JOBS } from "@/lib/jobs/mock-data";

// Real API aggregators
import { fetchAdzunaJobs } from "@/lib/jobs/aggregators/adzuna";
import { fetchJSearchJobs } from "@/lib/jobs/aggregators/jsearch";
import { fetchLoopCVJobs } from "@/lib/jobs/aggregators/loopcv";

// NEW: No-auth required APIs
import { fetchRemoteOKJobs } from "@/lib/jobs/aggregators/remoteok";
import { fetchJobicyJobs } from "@/lib/jobs/aggregators/jobicy";
import { fetchGreenhouseJobs } from "@/lib/jobs/aggregators/greenhouse";
import { fetchLeverJobs } from "@/lib/jobs/aggregators/lever";
import { fetchAshbyJobs } from "@/lib/jobs/aggregators/ashby";

// Build cache key from all search parameters
function buildCacheKey(params: Record<string, any>): string {
  const sorted = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {} as Record<string, any>);
  const str = JSON.stringify(sorted);
  return Buffer.from(str).toString('base64').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 100);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract all filter parameters
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
    const perPage = parseInt(searchParams.get("perPage") || "12", 10);

    // Build cache key including ALL filters (critical for job type separation)
    const cacheKey = buildCacheKey({
      q, location, jobTypes, experience, skills, salaryMin, salaryMax, remote, postedWithin, page, perPage
    });

    // 1. CHECK CACHE FIRST
    const cached = await getCachedJobs(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    // 2. FETCH LIVE DATA FROM ALL APIs IN PARALLEL
    console.log(`[API] Cache miss. Fetching live for: "${q}" | Types: ${jobTypes.join(',') || 'all'} | Page: ${page}`);

    const apiCalls = [
      // No-auth APIs (always fetch)
      fetchRemoteOKJobs(q),
      fetchJobicyJobs(perPage, undefined, undefined, q),
      fetchGreenhouseJobs(),
      fetchLeverJobs(),
      fetchAshbyJobs()
    ];

    // Auth-required APIs (conditional)
    if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
      apiCalls.push(fetchAdzunaJobs(q, location, page));
    }
    if (process.env.RAPIDAPI_KEY) {
      apiCalls.push(fetchJSearchJobs(q, location, page));
    }
    if (process.env.LOOPCV_API_KEY) {
      apiCalls.push(fetchLoopCVJobs(q, location, perPage));
    }

    const apiResults = await Promise.allSettled(apiCalls);

    let allJobs: any[] = [];
    const sourceStats: Record<string, number> = {};
    let totalApiJobs = 0;

    apiResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
        allJobs.push(...result.value);
        totalApiJobs += result.value.length;
      }
    });

    // Log source breakdown for debugging
    console.log(`[API] Fetched ${totalApiJobs} total jobs from live APIs`);

    // 3. IF NO REAL JOBS, USE FALLBACK (clearly marked as demo)
    const isDemoMode = allJobs.length === 0;
    if (isDemoMode) {
      console.log("[API] No live jobs found. Using demo fallback data.");
      allJobs = HIGH_FIDELITY_FALLBACK_JOBS.map(job => ({
        ...job,
        source: 'demo',
        sourceAttribution: 'Demo Data — Add API keys for live feeds'
      }));
    }

    // Count job types BEFORE filter application for accurate sidebar counts
    const jobTypeCounts: Record<string, number> = {
      "full-time": 0,
      "part-time": 0,
      "contract": 0,
      "internship": 0,
      "freelance": 0
    };
    allJobs.forEach((job) => {
      if (job.jobType in jobTypeCounts) {
        jobTypeCounts[job.jobType]++;
      }
    });

    // 4. APPLY ALL FILTERS ON LIVE DATA
    let filteredJobs = [...allJobs];

    // Job Type Filter — CRITICAL FIX
    if (jobTypes.length > 0) {
      filteredJobs = filteredJobs.filter((job) => jobTypes.includes(job.jobType));
      console.log(`[Filter] After jobType [${jobTypes.join(',')}]: ${filteredJobs.length} jobs`);
    }

    // Experience filter
    if (experience.length > 0) {
      filteredJobs = filteredJobs.filter((job) => experience.includes(job.experienceLevel));
    }

    // Text search (title, company, description, skills)
    if (q.trim()) {
      const term = q.toLowerCase().trim();
      filteredJobs = filteredJobs.filter((job) => 
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term) ||
        job.skills.some((s: string) => s.toLowerCase().includes(term))
      );
    }

    // Location filter
    if (location.trim()) {
      const locTerm = location.toLowerCase().trim();
      filteredJobs = filteredJobs.filter((job) => 
        job.location.toLowerCase().includes(locTerm)
      );
    }

    // Remote filter
    if (remote) {
      filteredJobs = filteredJobs.filter((job) => 
        job.location.toLowerCase().includes("remote")
      );
    }

    // Skills filter
    if (skills.length > 0) {
      filteredJobs = filteredJobs.filter((job) =>
        skills.some((s) => job.skills.map((js: string) => js.toLowerCase()).includes(s.toLowerCase()))
      );
    }

    // Salary filter
    if (salaryMin !== undefined) {
      filteredJobs = filteredJobs.filter((job) => !job.salaryMin || job.salaryMin >= salaryMin);
    }
    if (salaryMax !== undefined) {
      filteredJobs = filteredJobs.filter((job) => !job.salaryMax || job.salaryMax <= salaryMax);
    }

    // Posted within filter
    if (postedWithin !== "all") {
      const now = Date.now();
      let limitMs = 30 * 24 * 60 * 60 * 1000;
      if (postedWithin === "24h") limitMs = 24 * 60 * 60 * 1000;
      if (postedWithin === "7d") limitMs = 7 * 24 * 60 * 60 * 1000;

      filteredJobs = filteredJobs.filter(
        (job) => now - new Date(job.postedDate).getTime() <= limitMs
      );
    }

    // Sort by postedDate descending (newest first)
    filteredJobs.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());

    // Calculate source breakdown
    const sourceBreakdown: Record<string, number> = {};
    filteredJobs.forEach((job) => {
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
      fetchedAt: new Date().toISOString(),
      jobTypeCounts
    };

    // 5. CACHE RESULT (10 minutes for live data)
    await saveJobsToCache(cacheKey, result, 10 * 60 * 1000);

    return NextResponse.json({
      ...result,
      isDemoMode,
      totalApiJobs,
      jobTypeCounts
    });

  } catch (error: any) {
    console.error("[API GET Jobs] Error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error.message,
      isDemoMode: true
    }, { status: 500 });
  }
}
