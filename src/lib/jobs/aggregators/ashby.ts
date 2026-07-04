import { UnifiedJob } from "../types";
import { normalizeJobs, normalizeExperience, normalizeJobType, extractSkills } from "./normalizer";

const ASHBY_COMPANIES = [
  "runway", "solace", "factory", "kong", "vestwell"
];

export async function fetchAshbyJobs(): Promise<UnifiedJob[]> {
  const allJobs: any[] = [];
  
  for (const company of ASHBY_COMPANIES) {
    try {
      const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${company}`);
      if (!res.ok) continue;
      
      const data = await res.json();
      if (!data || !Array.isArray(data.jobs)) continue;

      const companyName = company.charAt(0).toUpperCase() + company.slice(1);
      
      const normalized = data.jobs.map((job: any) => {
        const title = job.title || "Software Engineer";
        const descPlain = job.descriptionPlain || "";
        const compensation = job.compensation || {};
        const tierSummary = compensation.compensationTierSummary || {};
        
        return {
          id: `dm-ashby-${company}-${job.id}`,
          title: title,
          company: companyName,
          location: job.location || "Remote",
          jobType: normalizeJobType(title + " " + (job.employmentType || "")),
          experienceLevel: normalizeExperience(title, descPlain),
          salaryMin: tierSummary.min || 0,
          salaryMax: tierSummary.max || 0,
          salaryCurrency: "USD",
          salaryPeriod: "yearly" as const,
          description: descPlain.substring(0, 1000) || "",
          requirements: [],
          skills: extractSkills(title, descPlain),
          postedDate: job.publishedAt ? new Date(job.publishedAt).toISOString() : new Date().toISOString(),
          applyUrl: job.jobUrl || `https://jobs.ashbyhq.com/${company}/${job.id}`
        };
      });
      
      allJobs.push(...normalized);
    } catch (e) {
      console.warn(`Failed to fetch Ashby jobs for ${company}:`, e);
    }
  }
  
  return normalizeJobs(allJobs, "ashby");
}
