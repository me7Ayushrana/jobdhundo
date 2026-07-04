import { UnifiedJob } from "../types";
import { normalizeJobs, extractSkills, normalizeJobType, normalizeExperience } from "./normalizer";

export async function fetchJobicyJobs(
  count: number = 50,
  geo?: string,
  industry?: string,
  tag?: string
): Promise<UnifiedJob[]> {
  try {
    let url = `https://jobicy.com/api/v2/remote-jobs?count=${count}`;
    if (geo) url += `&geo=${encodeURIComponent(geo)}`;
    if (industry) url += `&industry=${encodeURIComponent(industry)}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'JobDhundo/1.0' },
      next: { revalidate: 600 }
    });
    
    if (!res.ok) {
      console.warn(`[Jobicy] API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const jobs = data.jobs || [];
    
    const normalized = jobs.map((job: any) => ({
      id: `dm-jobicy-${job.id}`,
      title: job.jobTitle || 'Unknown Position',
      company: job.companyName || 'Unknown Company',
      companyLogo: job.companyLogo,
      location: job.jobGeo || 'Remote',
      jobType: normalizeJobType(job.jobType || 'full-time'),
      experienceLevel: normalizeExperience(job.jobTitle || '', job.jobDescription || ''),
      salaryMin: job.salaryMin || 0,
      salaryMax: job.salaryMax || 0,
      salaryCurrency: job.salaryCurrency || 'USD',
      salaryPeriod: job.salaryPeriod || 'yearly',
      description: job.jobDescription || '',
      requirements: [],
      skills: extractSkills(job.jobTitle || '', job.jobDescription || ''),
      postedDate: job.pubDate || new Date().toISOString(),
      applyUrl: job.url || `https://jobicy.com/job/${job.id}`,
      source: 'jobicy',
      sourceAttribution: 'via Jobicy'
    }));

    return normalizeJobs(normalized, 'jobicy');
    
  } catch (error) {
    console.error("[Jobicy] Error:", error);
    return [];
  }
}
