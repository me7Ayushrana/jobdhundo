import { NextRequest, NextResponse } from "next/server";
import { JobSearchResult } from "@/lib/jobs/types";
import { HIGH_FIDELITY_FALLBACK_JOBS } from "@/lib/jobs/mock-data";

// Import real API aggregators
import { fetchRemoteOKJobs } from "@/lib/jobs/aggregators/remoteok";
import { fetchJobicyJobs } from "@/lib/jobs/aggregators/jobicy";

// Import existing aggregators (if you have them)
let fetchAdzunaJobs: any, fetchJSearchJobs: any, fetchLoopCVJobs: any;
try {
  const adzuna = require("@/lib/jobs/aggregators/adzuna");
  fetchAdzunaJobs = adzuna.fetchAdzunaJobs;
} catch (e) { fetchAdzunaJobs = null; }

try {
  const jsearch = require("@/lib/jobs/aggregators/jsearch");
  fetchJSearchJobs = jsearch.fetchJSearchJobs;
} catch (e) { fetchJSearchJobs = null; }

try {
  const loopcv = require("@/lib/jobs/aggregators/loopcv");
  fetchLoopCVJobs = loopcv.fetchLoopCVJobs;
} catch (e) { fetchLoopCVJobs = null; }

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCacheKey(params: Record<string, any>): string {
  const str = JSON.stringify(params);
  return btoa(str).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 100);
}

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
    const perPage = parseInt(searchParams.get("perPage") || "12", 10);

    const cacheKey = getCacheKey({ q, location, jobTypes, experience, skills, salaryMin, salaryMax, remote, postedWithin, page, perPage });

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ ...cached.data, cached: true });
    }

    console.log(`[API] Fetching live data for: "${q}" | Types: ${jobTypes.join(',') || 'all'}`);

    // Fetch from ALL APIs in parallel
    const apiCalls = [
      fetchRemoteOKJobs(q),
      fetchJobicyJobs(perPage, q)
    ];

    // Add auth-required APIs if keys exist
    if (process.env.ADZUNA_APP_ID && fetchAdzunaJobs) {
      apiCalls.push(fetchAdzunaJobs(q, location, page));
    }
    if (process.env.RAPIDAPI_KEY && fetchJSearchJobs) {
      apiCalls.push(fetchJSearchJobs(q, location, page));
    }
    if (process.env.LOOPCV_API_KEY && fetchLoopCVJobs) {
      apiCalls.push(fetchLoopCVJobs(q, location, perPage));
    }

    const apiResults = await Promise.allSettled(apiCalls);

    let allJobs: any[] = [];
    let totalApiJobs = 0;

    apiResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
        allJobs.push(...result.value);
        totalApiJobs += result.value.length;
      }
    });

    console.log(`[API] Fetched ${totalApiJobs} jobs from live APIs`);

    // If no real jobs, use fallback (demo mode)
    const isDemoMode = allJobs.length === 0;
    if (isDemoMode) {
      console.log("[API] No live jobs. Using demo fallback.");
      allJobs = HIGH_FIDELITY_FALLBACK_JOBS.map(job => ({
        ...job,
        source: 'demo',
        sourceAttribution: 'Demo Data — Add API keys for live feeds'
      }));
    }

    // Apply filters
    let filteredJobs = [...allJobs];

    // Job Type Filter — CRITICAL FIX
    if (jobTypes.length > 0) {
      filteredJobs = filteredJobs.filter((job) => jobTypes.includes(job.jobType));
    }

    // Experience filter
    if (experience.length > 0) {
      filteredJobs = filteredJobs.filter((job) => experience.includes(job.experienceLevel));
    }

    // Text search
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

    // Sort by newest
    filteredJobs.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {};
    filteredJobs.forEach((job) => {
      sourceBreakdown[job.source] = (sourceBreakdown[job.source] || 0) + 1;
    });

    // Paginate
    const totalResults = filteredJobs.length;
    const startIndex = (page - 1) * perPage;
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + perPage);
    const hasMore = startIndex + perPage < totalResults;

    const result = {
      jobs: paginatedJobs,
      totalResults,
      page,
      perPage,
      hasMore,
      sourceBreakdown,
      cached: false,
      fetchedAt: new Date().toISOString(),
      isDemoMode,
      totalApiJobs
    };

    // Save to cache
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[API GET Jobs] Error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error.message,
      isDemoMode: true
    }, { status: 500 });
  }
}
