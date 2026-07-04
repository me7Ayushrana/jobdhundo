import { UnifiedJob } from "../types";
import { normalizeJobs, normalizeExperience, normalizeJobType, extractSkills } from "./normalizer";

const GREENHOUSE_COMPANIES = [
  "stripe", "airbnb", "notion", "figma", "linear", "vercel", 
  "supabase", "planetscale", "render", "railway"
];

export async function fetchGreenhouseJobs(): Promise<UnifiedJob[]> {
  const allJobs: any[] = [];
  
  for (const company of GREENHOUSE_COMPANIES) {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs`);
      if (!res.ok) continue;
      
      const data = await res.json();
      if (!data || !Array.isArray(data.jobs)) continue;

      const companyName = company.charAt(0).toUpperCase() + company.slice(1);
      
      const normalized = data.jobs.map((job: any) => {
        const title = job.title || "Software Engineer";
        const content = job.content || "";
        return {
          id: `dm-gh-${company}-${job.id}`,
          title: title,
          company: companyName,
          location: job.location?.name || "Remote",
          jobType: normalizeJobType(title),
          experienceLevel: normalizeExperience(title, content),
          description: content.replace(/<[^>]*>/g, "").substring(0, 1000) || "",
          requirements: [],
          skills: extractSkills(title, content),
          postedDate: new Date().toISOString(), // Greenhouse boards-api does not return date
          applyUrl: job.absolute_url || `https://boards.greenhouse.io/${company}/jobs/${job.id}`
        };
      });
      
      allJobs.push(...normalized);
    } catch (e) {
      console.warn(`Failed to fetch Greenhouse jobs for ${company}:`, e);
    }
  }
  
  return normalizeJobs(allJobs, "greenhouse");
}
