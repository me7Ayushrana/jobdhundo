import { UnifiedJob } from "../types";
import { normalizeJobType } from "./normalizer";

export async function fetchJobicyJobs(
  count: number = 50,
  tag?: string
): Promise<UnifiedJob[]> {
  try {
    let url = `https://jobicy.com/api/v2/remote-jobs?count=${count}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'JobDhundo/1.0' }
    });
    
    if (!res.ok) {
      console.warn(`[Jobicy] API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const jobs = data.jobs || [];
    
    return jobs.map((job: any) => ({
      id: `dm-jobicy-${job.id}`,
      title: job.jobTitle || 'Unknown Position',
      company: job.companyName || 'Unknown Company',
      companyLogo: job.companyLogo,
      location: job.jobGeo || 'Remote',
      jobType: normalizeJobType(job.jobType),
      experienceLevel: 'mid',
      salaryMin: job.salaryMin || 0,
      salaryMax: job.salaryMax || 0,
      salaryCurrency: job.salaryCurrency || 'USD',
      salaryPeriod: job.salaryPeriod || 'yearly',
      description: job.jobDescription || '',
      requirements: [],
      skills: [],
      postedDate: job.pubDate || new Date().toISOString(),
      applyUrl: job.url || `https://jobicy.com/job/${job.id}`,
      source: 'jobicy',
      sourceAttribution: 'via Jobicy'
    }));
    
  } catch (error) {
    console.error("[Jobicy] Error:", error);
    return [];
  }
}
