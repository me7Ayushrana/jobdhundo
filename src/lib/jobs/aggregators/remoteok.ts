import { UnifiedJob } from "../types";

export async function fetchRemoteOKJobs(tag?: string): Promise<UnifiedJob[]> {
  try {
    const url = tag 
      ? `https://remoteok.com/api?tag=${encodeURIComponent(tag)}` 
      : 'https://remoteok.com/api';
    
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'JobDhundo/1.0' }
    });
    
    if (!res.ok) {
      console.warn(`[RemoteOK] API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const jobs = Array.isArray(data) ? data.slice(1) : [];
    
    return jobs.map((job: any) => ({
      id: `dm-remoteok-${job.id}`,
      title: job.position || 'Unknown Position',
      company: job.company || 'Unknown Company',
      location: job.location || 'Remote',
      jobType: 'full-time',
      experienceLevel: 'mid',
      salaryMin: job.salary_min ? parseInt(job.salary_min) : undefined,
      salaryMax: job.salary_max ? parseInt(job.salary_max) : undefined,
      salaryCurrency: 'USD',
      salaryPeriod: 'yearly',
      description: job.description || '',
      requirements: [],
      skills: job.tags || [],
      postedDate: job.date ? new Date(job.date).toISOString() : new Date().toISOString(),
      applyUrl: job.apply_url || job.url || `https://remoteok.com/remote-jobs/${job.id}`,
      source: 'remoteok',
      sourceAttribution: 'via RemoteOK'
    }));
    
  } catch (error) {
    console.error("[RemoteOK] Error:", error);
    return [];
  }
}
