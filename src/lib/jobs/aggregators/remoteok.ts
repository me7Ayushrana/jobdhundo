import { UnifiedJob } from "../types";
import { normalizeJobs, normalizeJobType } from "./normalizer";

export async function fetchRemoteOKJobs(tag?: string): Promise<UnifiedJob[]> {
  try {
    const url = tag ? `https://remoteok.com/api?tag=${tag}` : 'https://remoteok.com/api';
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    if (!res.ok) {
      console.warn(`RemoteOK API returned status ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    if (!Array.isArray(data) || data.length <= 1) return [];
    
    // data[0] is legal/metadata statement, rest are job items
    const jobs = data.slice(1).map((job: any) => {
      const position = job.position || "Software Engineer";
      const tags = job.tags || [];
      return {
        id: `dm-remoteok-${job.id}`,
        title: position,
        company: job.company || "Remote Company",
        companyLogo: job.company_logo || undefined,
        location: job.location || "Remote",
        jobType: normalizeJobType(position + " " + tags.join(" ")),
        experienceLevel: "mid" as const,
        salaryMin: job.salary_min || 0,
        salaryMax: job.salary_max || 0,
        salaryCurrency: "USD",
        salaryPeriod: "yearly" as const,
        description: job.description || "",
        requirements: [],
        skills: tags || [],
        postedDate: job.date ? new Date(job.date).toISOString() : new Date().toISOString(),
        applyUrl: job.apply_url || job.url || ""
      };
    });

    return normalizeJobs(jobs, "remoteok");
  } catch (error) {
    console.error("Failed to fetch RemoteOK jobs:", error);
    return [];
  }
}
