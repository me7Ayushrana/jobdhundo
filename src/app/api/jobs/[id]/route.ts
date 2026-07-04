import { NextRequest, NextResponse } from "next/server";
import { HIGH_FIDELITY_FALLBACK_JOBS } from "@/lib/jobs/mock-data";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { findJobInMemoryCache } from "@/lib/jobs/cache";
import { normalizeJobType, normalizeExperience, extractSkills } from "@/lib/jobs/aggregators/normalizer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 16 App Router requires awaiting params if it is a promise
    const resolvedParams = typeof (params as any).then === "function" 
      ? await (params as any) 
      : params;
    const { id } = resolvedParams;

    // 1. Check mock jobs
    const mockJob = HIGH_FIDELITY_FALLBACK_JOBS.find((j) => j.id === id);
    if (mockJob) {
      return NextResponse.json(mockJob);
    }

    // 2. Scan memory cache
    const memoryJob = findJobInMemoryCache(id);
    if (memoryJob) {
      return NextResponse.json(memoryJob);
    }

    // 3. Scan Firestore cache to locate the job
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, "job_cache"));
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          if (data.result) {
            const resultObj = JSON.parse(data.result);
            if (resultObj.jobs && Array.isArray(resultObj.jobs)) {
              const found = resultObj.jobs.find((j: any) => j.id === id);
              if (found) {
                return NextResponse.json(found);
              }
            }
          }
        }
      } catch (firestoreError) {
        console.warn("[API GET Job Details] Firestore search warning:", firestoreError);
      }
    }

    // 4. Live fetch fallback based on ID prefix
    console.log(`[API GET Job Details] Cache miss for ID "${id}". Executing live fallback fetch...`);

    // Greenhouse Fallback
    if (id.startsWith("dm-gh-")) {
      const parts = id.replace("dm-gh-", "").split("-");
      if (parts.length >= 2) {
        const company = parts[0];
        const jobId = parts.slice(1).join("-");
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs/${jobId}`);
        if (res.ok) {
          const jobData = await res.json();
          return NextResponse.json({
            id,
            title: jobData.title,
            company: company.charAt(0).toUpperCase() + company.slice(1),
            location: jobData.location?.name || 'Remote',
            jobType: normalizeJobType(jobData.title),
            experienceLevel: normalizeExperience(jobData.title, ''),
            description: jobData.content || jobData.description || '',
            requirements: [],
            skills: extractSkills(jobData.title, jobData.content || ''),
            postedDate: new Date().toISOString(),
            applyUrl: jobData.absolute_url,
            source: 'greenhouse',
            sourceAttribution: `via ${company.charAt(0).toUpperCase() + company.slice(1)}`
          });
        }
      }
    }

    // Lever Fallback
    if (id.startsWith("dm-lever-")) {
      const parts = id.replace("dm-lever-", "").split("-");
      if (parts.length >= 2) {
        const company = parts[0];
        const jobId = parts.slice(1).join("-");
        const res = await fetch(`https://api.lever.co/v0/postings/${company}/${jobId}?mode=json`);
        if (res.ok) {
          const jobData = await res.json();
          return NextResponse.json({
            id,
            title: jobData.text,
            company: company.charAt(0).toUpperCase() + company.slice(1),
            location: jobData.categories?.location || 'Remote',
            jobType: normalizeJobType(jobData.categories?.commitment || ''),
            experienceLevel: normalizeExperience(jobData.text, ''),
            description: jobData.description?.replace(/<[^>]*>/g, '') || '',
            requirements: [],
            skills: extractSkills(jobData.text, jobData.description || ''),
            postedDate: new Date().toISOString(),
            applyUrl: jobData.applyUrl || jobData.hostedUrl,
            source: 'lever',
            sourceAttribution: `via ${company.charAt(0).toUpperCase() + company.slice(1)}`
          });
        }
      }
    }

    // Ashby Fallback
    if (id.startsWith("dm-ashby-")) {
      const parts = id.replace("dm-ashby-", "").split("-");
      if (parts.length >= 2) {
        const company = parts[0];
        const jobId = parts.slice(1).join("-");
        const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${company}`);
        if (res.ok) {
          const data = await res.json();
          const found = data.jobs?.find((j: any) => String(j.id) === jobId);
          if (found) {
            return NextResponse.json({
              id,
              title: found.title,
              company: company.charAt(0).toUpperCase() + company.slice(1),
              location: found.location || 'Remote',
              jobType: normalizeJobType(found.title + " " + (found.employmentType || '')),
              experienceLevel: normalizeExperience(found.title, ''),
              salaryMin: found.compensation?.compensationTierSummary?.min || 0,
              salaryMax: found.compensation?.compensationTierSummary?.max || 0,
              salaryCurrency: 'USD',
              salaryPeriod: 'yearly',
              description: found.descriptionPlain || '',
              requirements: [],
              skills: extractSkills(found.title, found.descriptionPlain || ''),
              postedDate: new Date().toISOString(),
              applyUrl: found.jobUrl,
              source: 'ashby',
              sourceAttribution: `via ${company.charAt(0).toUpperCase() + company.slice(1)}`
            });
          }
        }
      }
    }

    // RemoteOK Fallback
    if (id.startsWith("dm-remoteok-")) {
      const jobId = id.replace("dm-remoteok-", "");
      const res = await fetch('https://remoteok.com/api', {
        headers: { 'User-Agent': 'JobDhundo/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        const jobs = Array.isArray(data) ? data.slice(1) : [];
        const found = jobs.find((j: any) => String(j.id) === jobId);
        if (found) {
          const position = found.position || 'Unknown Position';
          const tags = found.tags || [];
          return NextResponse.json({
            id,
            title: position,
            company: found.company || 'Unknown Company',
            location: found.location || 'Remote',
            jobType: normalizeJobType(position + " " + tags.join(" ")),
            experienceLevel: 'mid' as const,
            salaryMin: found.salary_min ? parseInt(found.salary_min) : undefined,
            salaryMax: found.salary_max ? parseInt(found.salary_max) : undefined,
            salaryCurrency: 'USD',
            salaryPeriod: 'yearly' as const,
            description: found.description || '',
            requirements: [],
            skills: tags.length > 0 ? tags : extractSkills(position, found.description || ''),
            postedDate: found.date ? new Date(found.date).toISOString() : new Date().toISOString(),
            applyUrl: found.apply_url || found.url || `https://remoteok.com/remote-jobs/${found.id}`,
            source: 'remoteok',
            sourceAttribution: 'via RemoteOK'
          });
        }
      }
    }

    // Jobicy Fallback
    if (id.startsWith("dm-jobicy-")) {
      const jobId = id.replace("dm-jobicy-", "");
      const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=50`, {
        headers: { 'User-Agent': 'JobDhundo/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        const jobs = data.jobs || [];
        const found = jobs.find((j: any) => String(j.id) === jobId);
        if (found) {
          return NextResponse.json({
            id,
            title: found.jobTitle || 'Unknown Position',
            company: found.companyName || 'Unknown Company',
            companyLogo: found.companyLogo,
            location: found.jobGeo || 'Remote',
            jobType: normalizeJobType(found.jobType || 'full-time'),
            experienceLevel: normalizeExperience(found.jobTitle || '', found.jobDescription || ''),
            salaryMin: found.salaryMin || 0,
            salaryMax: found.salaryMax || 0,
            salaryCurrency: found.salaryCurrency || 'USD',
            salaryPeriod: found.salaryPeriod || 'yearly',
            description: found.jobDescription || '',
            requirements: [],
            skills: extractSkills(found.jobTitle || '', found.jobDescription || ''),
            postedDate: found.pubDate || new Date().toISOString(),
            applyUrl: found.url || `https://jobicy.com/job/${found.id}`,
            source: 'jobicy',
            sourceAttribution: 'via Jobicy'
          });
        }
      }
    }

    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  } catch (error: any) {
    console.error("GET Job Details Error:", error);
    return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 });
  }
}
