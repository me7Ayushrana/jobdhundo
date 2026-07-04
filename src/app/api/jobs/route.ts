import { NextRequest, NextResponse } from "next/server";
import { generateDedupeHash } from "@/lib/jobs/sync-manager";
import { JobSearchResult, UnifiedJob } from "@/lib/jobs/types";
import { HIGH_FIDELITY_FALLBACK_JOBS } from "@/lib/jobs/mock-data";
import { getCacheKey, getCachedJobs, saveJobsToCache } from "@/lib/jobs/cache";

// Live APIs
import { fetchAdzunaJobs } from "@/lib/jobs/aggregators/adzuna";
import { fetchJSearchJobs } from "@/lib/jobs/aggregators/jsearch";
import { fetchLoopCVJobs } from "@/lib/jobs/aggregators/loopcv";
import { fetchRemoteOKJobs } from "@/lib/jobs/aggregators/remoteok";
import { fetchJobicyJobs } from "@/lib/jobs/aggregators/jobicy";
import { fetchGreenhouseJobs } from "@/lib/jobs/aggregators/greenhouse";
import { fetchLeverJobs } from "@/lib/jobs/aggregators/lever";
import { fetchAshbyJobs } from "@/lib/jobs/aggregators/ashby";
import { fetchHNJobs } from "@/lib/jobs/aggregators/hackernews";

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

    // Build unique cache key from all filters including page parameters
    const filters = {
      q,
      location,
      jobType: jobTypes.join(","),
      experience: experience.join(","),
      skills: skills.join(","),
      salaryMin: salaryMin || 0,
      salaryMax: salaryMax || 0,
      remote,
      postedWithin,
      page,
      perPage
    };

    const cacheKey = getCacheKey(filters);
    const cachedData = await getCachedJobs(cacheKey);

    if (cachedData) {
      console.log(`[Jobs API] Cache hit for key: ${cacheKey}`);
      return NextResponse.json(cachedData);
    }

    console.log(`[Jobs API] Cache miss for key: ${cacheKey}. Performing parallel live fetches...`);

    const adzunaId = process.env.ADZUNA_APP_ID;
    const adzunaKey = process.env.ADZUNA_APP_KEY;
    const jsearchKey = process.env.RAPIDAPI_KEY;
    const loopcvKey = process.env.LOOPCV_API_KEY;

    // Define all no-auth APIs to call in parallel
    const apiPromises: Promise<UnifiedJob[]>[] = [
      fetchRemoteOKJobs(q || undefined),
      fetchJobicyJobs(50, undefined, undefined, q || undefined),
      fetchGreenhouseJobs(),
      fetchLeverJobs(),
      fetchAshbyJobs(),
      fetchHNJobs()
    ];

    // Conditionally append keys requiring keys
    if (adzunaId && adzunaKey) {
      apiPromises.push(fetchAdzunaJobs(q || "software developer", location || "", page));
    }
    if (jsearchKey) {
      apiPromises.push(fetchJSearchJobs(q || "software developer", location || "", page));
    }
    if (loopcvKey) {
      apiPromises.push(fetchLoopCVJobs(q || "software developer", location || "", 15));
    }

    const apiResults = await Promise.allSettled(apiPromises);
    const rawJobs: UnifiedJob[] = [];

    apiResults.forEach((res) => {
      if (res.status === "fulfilled") {
        rawJobs.push(...(res.value || []));
      }
    });

    // Deduplicate
    const seen = new Set<string>();
    const deduplicatedJobs: UnifiedJob[] = [];
    for (const job of rawJobs) {
      const hash = generateDedupeHash(job.company, job.title, job.location);
      if (!seen.has(hash)) {
        seen.add(hash);
        deduplicatedJobs.push(job);
      }
    }

    // Apply filters on the live collected data (except jobType first to calculate counts)
    let filteredJobsWithoutJobType = [...deduplicatedJobs];

    if (q.trim()) {
      const term = q.toLowerCase().trim();
      filteredJobsWithoutJobType = filteredJobsWithoutJobType.filter((job) => {
        return (
          job.title.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term) ||
          job.skills.some((s) => s.toLowerCase().includes(term))
        );
      });
    }

    if (location.trim()) {
      const locTerm = location.toLowerCase().trim();
      filteredJobsWithoutJobType = filteredJobsWithoutJobType.filter((job) => 
        job.location.toLowerCase().includes(locTerm)
      );
    }

    if (experience.length > 0) {
      filteredJobsWithoutJobType = filteredJobsWithoutJobType.filter((job) => experience.includes(job.experienceLevel));
    }

    if (remote) {
      filteredJobsWithoutJobType = filteredJobsWithoutJobType.filter((job) => 
        job.location.toLowerCase().includes("remote")
      );
    }

    if (skills.length > 0) {
      filteredJobsWithoutJobType = filteredJobsWithoutJobType.filter((job) =>
        skills.some((s) => job.skills.map((js) => js.toLowerCase()).includes(s.toLowerCase()))
      );
    }

    if (salaryMin !== undefined) {
      filteredJobsWithoutJobType = filteredJobsWithoutJobType.filter((job) => !job.salaryMin || job.salaryMin >= salaryMin);
    }
    if (salaryMax !== undefined) {
      filteredJobsWithoutJobType = filteredJobsWithoutJobType.filter((job) => !job.salaryMax || job.salaryMax <= salaryMax);
    }

    if (postedWithin !== "all") {
      const now = Date.now();
      let limitMs = 30 * 24 * 60 * 60 * 1000;
      if (postedWithin === "24h") limitMs = 24 * 60 * 60 * 1000;
      if (postedWithin === "7d") limitMs = 7 * 24 * 60 * 60 * 1000;

      filteredJobsWithoutJobType = filteredJobsWithoutJobType.filter(
        (job) => now - new Date(job.postedDate).getTime() <= limitMs
      );
    }

    // Initialize counts
    const jobTypeCounts: Record<string, number> = {
      "full-time": 0,
      "part-time": 0,
      "contract": 0,
      "internship": 0,
      "freelance": 0
    };
    filteredJobsWithoutJobType.forEach((job) => {
      if (job.jobType in jobTypeCounts) {
        jobTypeCounts[job.jobType]++;
      }
    });

    // Apply jobType filter on live results
    let filteredJobs = [...filteredJobsWithoutJobType];
    if (jobTypes.length > 0) {
      filteredJobs = filteredJobs.filter((job) => jobTypes.includes(job.jobType));
    }

    // Determine Demo Mode if zero real live results return
    let isDemoMode = false;
    if (filteredJobs.length === 0) {
      isDemoMode = true;
      console.log("[Jobs API] Zero real jobs found. Serving filtered demo fallback data...");

      let fallbackJobs = HIGH_FIDELITY_FALLBACK_JOBS.map((j) => ({
        ...j,
        source: "demo",
        sourceAttribution: "Demo Data — Add API keys for live feeds"
      }));

      // Filter fallback jobs by non-jobType criteria first to compute counts
      let fallbackJobsWithoutJobType = [...fallbackJobs];
      if (q.trim()) {
        const term = q.toLowerCase().trim();
        fallbackJobsWithoutJobType = fallbackJobsWithoutJobType.filter((job) => {
          return (
            job.title.toLowerCase().includes(term) ||
            job.company.toLowerCase().includes(term) ||
            job.description.toLowerCase().includes(term) ||
            job.skills.some((s) => s.toLowerCase().includes(term))
          );
        });
      }

      if (location.trim()) {
        const locTerm = location.toLowerCase().trim();
        fallbackJobsWithoutJobType = fallbackJobsWithoutJobType.filter((job) => 
          job.location.toLowerCase().includes(locTerm)
        );
      }

      if (experience.length > 0) {
        fallbackJobsWithoutJobType = fallbackJobsWithoutJobType.filter((job) => experience.includes(job.experienceLevel));
      }

      if (remote) {
        fallbackJobsWithoutJobType = fallbackJobsWithoutJobType.filter((job) => 
          job.location.toLowerCase().includes("remote")
        );
      }

      if (skills.length > 0) {
        fallbackJobsWithoutJobType = fallbackJobsWithoutJobType.filter((job) =>
          skills.some((s) => job.skills.map((js) => js.toLowerCase()).includes(s.toLowerCase()))
        );
      }

      if (salaryMin !== undefined) {
        fallbackJobsWithoutJobType = fallbackJobsWithoutJobType.filter((job) => !job.salaryMin || job.salaryMin >= salaryMin);
      }
      if (salaryMax !== undefined) {
        fallbackJobsWithoutJobType = fallbackJobsWithoutJobType.filter((job) => !job.salaryMax || job.salaryMax <= salaryMax);
      }

      if (postedWithin !== "all") {
        const now = Date.now();
        let limitMs = 30 * 24 * 60 * 60 * 1000;
        if (postedWithin === "24h") limitMs = 24 * 60 * 60 * 1000;
        if (postedWithin === "7d") limitMs = 7 * 24 * 60 * 60 * 1000;

        fallbackJobsWithoutJobType = fallbackJobsWithoutJobType.filter(
          (job) => now - new Date(job.postedDate).getTime() <= limitMs
        );
      }

      // Count fallback jobTypeCounts
      Object.keys(jobTypeCounts).forEach(k => { jobTypeCounts[k] = 0; });
      fallbackJobsWithoutJobType.forEach((job) => {
        if (job.jobType in jobTypeCounts) {
          jobTypeCounts[job.jobType]++;
        }
      });

      // Apply jobType filter on demo results
      filteredJobs = [...fallbackJobsWithoutJobType];
      if (jobTypes.length > 0) {
        filteredJobs = filteredJobs.filter((job) => jobTypes.includes(job.jobType));
      }
    }

    // Sort by newest postings
    filteredJobs.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());

    // Source stats breakdown
    const sourceBreakdown: Record<string, number> = {};
    filteredJobs.forEach((job) => {
      sourceBreakdown[job.source] = (sourceBreakdown[job.source] || 0) + 1;
    });

    // Slice for page pagination
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
      isDemoMode,
      jobTypeCounts // include computed counts in response
    };

    // Save search response cache
    const ttlMs = isDemoMode ? 24 * 60 * 60 * 1000 : 10 * 60 * 1000;
    await saveJobsToCache(cacheKey, result, ttlMs);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API GET Jobs] Endpoint search crash:", error);
    return NextResponse.json({ error: "Server search error", details: error.message }, { status: 500 });
  }
}
