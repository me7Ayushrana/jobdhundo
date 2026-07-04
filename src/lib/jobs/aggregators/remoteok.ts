import { UnifiedJob } from "../types";
import { normalizeJobs, extractSkills, normalizeJobType } from "./normalizer";

export async function fetchRemoteOKJobs(tag?: string): Promise<UnifiedJob[]> {
  try {
    const url = tag 
      ? `https://remoteok.com/api?tag=${encodeURIComponent(tag)}` 
      : 'https://remoteok.com/api';
    
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'JobDhundo/1.0' },
      next: { revalidate: 600 }
    });
    
    if (!res.ok) {
      console.warn(`[RemoteOK] API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const jobs = Array.isArray(data) ? data.slice(1) : [];
    
    const normalized = jobs.map((job: any) => {
      const position = job.position || 'Unknown Position';
      const tags = job.tags || [];
      return {
        id: `dm-remoteok-${job.id}`,
        title: position,
        company: job.company || 'Unknown Company',
        location: job.location || 'Remote',
        jobType: normalizeJobType(position + " " + tags.join(" ")),
        experienceLevel: 'mid' as const,
        salaryMin: job.salary_min ? parseInt(job.salary_min) : undefined,
        salaryMax: job.salary_max ? parseInt(job.salary_max) : undefined,
        salaryCurrency: 'USD',
        salaryPeriod: 'yearly' as const,
        description: job.description || '',
        requirements: [],
        skills: tags.length > 0 ? tags : extractSkills(position, job.description || ''),
        postedDate: job.date ? new Date(job.date).toISOString() : new Date().toISOString(),
        applyUrl: job.apply_url || job.url || `https://remoteok.com/remote-jobs/${job.id}`,
        source: 'remoteok',
        sourceAttribution: 'via RemoteOK'
      };
    });

    return normalizeJobs(normalized, 'remoteok');
    
  } catch (error) {
    console.error("[RemoteOK] Error:", error);
    return [];
  }
}
