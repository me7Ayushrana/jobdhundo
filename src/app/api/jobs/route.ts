import { NextRequest, NextResponse } from "next/server";
import { loadAllJobsFromDb } from "@/lib/jobs/sync-manager";
import { JobSearchResult } from "@/lib/jobs/types";

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

    // Load unified consolidated listings directly from centralized database (Firestore or Local JSON)
    const allDbJobs = await loadAllJobsFromDb();

    // Apply filters
    let filteredJobs = [...allDbJobs];

    // 1. Text Search (Query Title, Company, Description, or Skills)
    if (q.trim()) {
      const term = q.toLowerCase().trim();
      filteredJobs = filteredJobs.filter((job) => {
        return (
          job.title.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term) ||
          job.skills.some((s) => s.toLowerCase().includes(term))
        );
      });
    }

    // 2. Location filter
    if (location.trim()) {
      const locTerm = location.toLowerCase().trim();
      filteredJobs = filteredJobs.filter((job) => 
        job.location.toLowerCase().includes(locTerm)
      );
    }

    // 3. Job Types filter
    if (jobTypes.length > 0) {
      filteredJobs = filteredJobs.filter((job) => jobTypes.includes(job.jobType));
    }

    // 4. Experience filter
    if (experience.length > 0) {
      filteredJobs = filteredJobs.filter((job) => experience.includes(job.experienceLevel));
    }

    // 5. Remote filter
    if (remote) {
      filteredJobs = filteredJobs.filter((job) => 
        job.location.toLowerCase().includes("remote")
      );
    }

    // 6. Skills filter
    if (skills.length > 0) {
      filteredJobs = filteredJobs.filter((job) =>
        skills.some((s) => job.skills.map((js) => js.toLowerCase()).includes(s.toLowerCase()))
      );
    }

    // 7. Salary Min/Max Filter
    if (salaryMin !== undefined) {
      filteredJobs = filteredJobs.filter((job) => !job.salaryMin || job.salaryMin >= salaryMin);
    }
    if (salaryMax !== undefined) {
      filteredJobs = filteredJobs.filter((job) => !job.salaryMax || job.salaryMax <= salaryMax);
    }

    // 8. Recency (Posted Within) Filter
    if (postedWithin !== "all") {
      const now = Date.now();
      let limitMs = 30 * 24 * 60 * 60 * 1000; // default 30d
      if (postedWithin === "24h") limitMs = 24 * 60 * 60 * 1000;
      if (postedWithin === "7d") limitMs = 7 * 24 * 60 * 60 * 1000;

      filteredJobs = filteredJobs.filter(
        (job) => now - new Date(job.postedDate).getTime() <= limitMs
      );
    }

    // Sort by postedDate descending (newest opportunities first)
    filteredJobs.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());

    // Calculate source breakdowns dynamically
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
      fetchedAt: new Date().toISOString()
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API GET Jobs] Centralized query failed:", error);
    return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 });
  }
}
