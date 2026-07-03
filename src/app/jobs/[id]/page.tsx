"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Briefcase, Calendar, DollarSign, ExternalLink, Bookmark, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useSocial } from "@/components/providers/social-context";
import { UnifiedJob } from "@/lib/jobs/types";
import { calculateMatchScore } from "@/lib/jobs/match-scorer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { currentUser } = useSocial();

  const [job, setJob] = useState<UnifiedJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [similarJobs, setSimilarJobs] = useState<UnifiedJob[]>([]);

  // Fetch job details and similar jobs
  useEffect(() => {
    if (!id) return;
    
    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/jobs/${id}`);
        if (!res.ok) {
          throw new Error("Job not found");
        }
        const data: UnifiedJob = await res.json();
        
        // Calculate match score
        const userSkills = currentUser?.skills || ["React", "TypeScript", "Node.js"];
        const matchScore = calculateMatchScore(
          userSkills,
          data.skills,
          { preferredLocations: [], minSalary: 0, jobTypes: [], remoteOnly: false },
          data
        );
        
        const enriched = { ...data, matchScore };
        setJob(enriched);

        // Load saved state
        const saved = localStorage.getItem("devmatch_saved_jobs");
        if (saved) {
          const ids = JSON.parse(saved);
          setIsSaved(ids.includes(id));
        }

        // Fetch similar jobs by matching skills/company
        const similarRes = await fetch(`/api/jobs?q=${encodeURIComponent(data.skills[0] || "Software")}&perPage=3`);
        if (similarRes.ok) {
          const similarData = await similarRes.json();
          const filtered = (similarData.jobs as UnifiedJob[])
            .filter(j => j.id !== id)
            .slice(0, 3)
            .map(j => ({
              ...j,
              matchScore: calculateMatchScore(
                userSkills,
                j.skills,
                { preferredLocations: [], minSalary: 0, jobTypes: [], remoteOnly: false },
                j
              )
            }));
          setSimilarJobs(filtered);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load job details.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id, currentUser]);

  const handleSaveToggle = () => {
    if (!job) return;
    const saved = localStorage.getItem("devmatch_saved_jobs");
    let ids = [];
    if (saved) {
      try {
        ids = JSON.parse(saved);
      } catch (_) {}
    }

    let updated;
    if (ids.includes(job.id)) {
      updated = ids.filter((savedId: string) => savedId !== job.id);
      setIsSaved(false);
    } else {
      updated = [...ids, job.id];
      setIsSaved(true);
    }
    localStorage.setItem("devmatch_saved_jobs", JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 pt-36 pb-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin" />
        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Loading details...</span>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-stone-50 pt-36 pb-20 flex flex-col items-center justify-center space-y-6">
        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/25 text-rose-500 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-black text-stone-900">Job Listing Not Found</h2>
          <p className="text-xs text-stone-400 font-medium max-w-sm">
            {error || "The job opportunity may have expired or is no longer available in the aggregator cache."}
          </p>
        </div>
        <Link href="/jobs">
          <Button className="bg-primary text-white text-xs font-bold uppercase py-2.5 px-6 rounded-xl shadow-md">
            Back to Job Feed
          </Button>
        </Link>
      </div>
    );
  }

  const score = job.matchScore ?? 0;
  const userSkills = currentUser?.skills || ["React", "TypeScript", "Node.js"];
  const formattedSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return "Salary Undisclosed";
    const currency = job.salaryCurrency === "INR" ? "₹" : job.salaryCurrency === "EUR" ? "€" : job.salaryCurrency === "GBP" ? "£" : "$";
    const period = job.salaryPeriod === "hourly" ? "hour" : job.salaryPeriod === "monthly" ? "month" : "year";
    
    const formatNum = (num?: number) => {
      if (!num) return "";
      return num.toLocaleString(job.salaryCurrency === "INR" ? "en-IN" : "en-US");
    };

    if (job.salaryMin && job.salaryMax) {
      return `${currency}${formatNum(job.salaryMin)} - ${currency}${formatNum(job.salaryMax)} per ${period}`;
    }
    return `${currency}${formatNum(job.salaryMin || job.salaryMax)} per ${period}`;
  };

  const getScoreColor = (s: number) => {
    if (s >= 90) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (s >= 70) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    if (s >= 50) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="relative min-h-screen bg-stone-50 pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-5xl space-y-8">
        
        {/* Back Link */}
        <Link href="/jobs" className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-primary transition-colors uppercase tracking-wider">
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>

        {/* Header Block */}
        <div className="bg-white border border-black/5 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-4 items-start pr-4">
            {job.companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.companyLogo} alt={job.company} className="w-16 h-16 rounded-2xl object-contain bg-stone-50 border border-stone-100 p-2 mt-1" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center font-black text-stone-600 text-xl border border-stone-200 mt-1">
                {job.company.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm font-bold text-stone-400">{job.company}</span>
                <Badge variant="outline" className="text-[9px] uppercase font-black py-0.5 border-none bg-stone-50 text-stone-600">
                  {job.sourceAttribution}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-stone-900 leading-tight">
                {job.title}
              </h1>
            </div>
          </div>

          {/* DNA Scorer Box */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3 shrink-0 ${getScoreColor(score)}`}>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-sm">
              {score}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 leading-none">DNA Compatibility</span>
              <span className="text-xs font-bold mt-1">
                {score >= 70 ? "Excellent Fit" : score >= 50 ? "Moderate Fit" : "Skills Discrepancy"}
              </span>
            </div>
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white border border-black/5 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-900 mb-3">
                  Job Description
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed font-medium whitespace-pre-line">
                  {job.description}
                </p>
              </div>

              {job.requirements && job.requirements.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-900 mb-3">
                    Qualifications & Responsibilities
                  </h3>
                  <ul className="space-y-3">
                    {job.requirements.map((req, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-2.5 text-sm text-stone-600 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">
                  Similar Positions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {similarJobs.map(sj => (
                    <Link
                      key={sj.id}
                      href={`/jobs/${sj.id}`}
                      className="p-5 bg-white border border-black/5 rounded-2xl shadow-sm hover:border-primary/20 transition-all flex flex-col justify-between h-[160px]"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 block mb-1">{sj.company}</span>
                        <h4 className="font-bold text-xs text-stone-900 line-clamp-2 leading-snug">{sj.title}</h4>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-stone-50 mt-2 text-[10px] font-bold">
                        <span className="text-stone-500">{sj.location}</span>
                        <span className="text-primary">{sj.matchScore}% Match</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Details */}
          <div className="space-y-6">
            
            {/* Metadata Summary card */}
            <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Position Summary</h3>
              
              <div className="space-y-4 text-xs font-semibold text-stone-700">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                  <span className="capitalize">{job.jobType} ({job.experienceLevel} level)</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                  <span>{formattedSalary()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                  <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Tech Stack Indicator list */}
            <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Skills Comparison</h3>
              
              <div className="space-y-2">
                {job.skills.map((skill, sIdx) => {
                  const hasSkill = userSkills.some(us => us.toLowerCase() === skill.toLowerCase());
                  return (
                    <div key={sIdx} className="flex items-center justify-between text-xs py-2 px-3.5 rounded-xl bg-stone-50 border border-stone-100 font-semibold">
                      <span className="text-stone-800">{skill}</span>
                      {hasSkill ? (
                        <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 py-0.5 px-2 rounded-full border border-emerald-500/20">Have</span>
                      ) : (
                        <span className="text-[10px] font-bold text-stone-400">Missing</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save and Apply Sticky Container */}
            <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
              <Button
                onClick={() => window.open(`${job.applyUrl}?ref=devmatch`, "_blank")}
                className="w-full font-black uppercase tracking-widest py-5 rounded-2xl bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-[0.98] transition-transform"
              >
                Apply for Role <ExternalLink className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSaveToggle}
                className={`w-full font-bold uppercase tracking-wider py-5 rounded-2xl flex items-center justify-center gap-2 border-stone-200 dark:border-stone-800 transition-colors ${
                  isSaved ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15" : "hover:bg-stone-50 dark:hover:bg-stone-800"
                }`}
              >
                <Bookmark className="w-4.5 h-4.5" fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? "Saved Opportunity" : "Save to Profile"}
              </Button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
