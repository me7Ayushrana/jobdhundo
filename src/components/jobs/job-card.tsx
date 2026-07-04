"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, ExternalLink } from "lucide-react";
import { UnifiedJob } from "@/lib/jobs/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  job: UnifiedJob;
  userSkills?: string[];
  onViewDetails: (job: UnifiedJob) => void;
  onSave?: (job: UnifiedJob) => void;
  isSaved?: boolean;
}

export function JobCard({ job, userSkills = [], onViewDetails, onSave, isSaved = false }: JobCardProps) {
  const [saved, setSaved] = useState(isSaved);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
    if (onSave) {
      onSave(job);
    }
  };

  // Format Salary
  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return "Salary Undisclosed";
    
    const currencySym = job.salaryCurrency === "INR" ? "₹" : job.salaryCurrency === "EUR" ? "€" : job.salaryCurrency === "GBP" ? "£" : "$";
    const period = job.salaryPeriod === "hourly" ? "/hr" : job.salaryPeriod === "monthly" ? "/mo" : "/yr";
    
    const formatNum = (num?: number) => {
      if (!num) return "";
      if (job.salaryCurrency === "INR") {
        if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
        return num.toLocaleString("en-IN");
      }
      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
      return num.toLocaleString();
    };

    if (job.salaryMin && job.salaryMax) {
      return `${currencySym}${formatNum(job.salaryMin)} - ${formatNum(job.salaryMax)}${period}`;
    }
    return `${currencySym}${formatNum(job.salaryMin || job.salaryMax)}${period}`;
  };

  // Determine Match Score Color & Style
  const score = job.matchScore ?? 0;
  const getScoreStyles = (s: number) => {
    if (s >= 90) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (s >= 70) return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (s >= 50) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    return "bg-stone-500/10 text-stone-600 border-stone-500/20";
  };
  const scoreStyle = getScoreStyles(score);

  // Time posted display
  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Posted today";
      if (diffDays === 1) return "Posted yesterday";
      return `${diffDays} days ago`;
    } catch (_) {
      return "Recently";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => onViewDetails(job)}
      className="group relative flex flex-col justify-between p-6 bg-gradient-to-b from-white to-stone-50/40 border border-stone-200/80 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 min-h-[300px] overflow-hidden"
    >
      {/* Background Soft Glow Reveal */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" />

      <div className="space-y-4 relative z-10">
        
        {/* Top Header: Logo, Company & Badge / Bookmark */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {job.companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.companyLogo} alt={job.company} className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-stone-200/80 shadow-sm shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-100 to-stone-200/50 border border-stone-200/80 flex items-center justify-center font-extrabold text-stone-600 text-sm shrink-0 shadow-inner">
                {job.company.charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">{job.company}</span>
              <span className="text-[9px] font-bold text-stone-400 mt-1">{getRelativeTime(job.postedDate)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Match Score Badge (Saves huge space) */}
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${scoreStyle} shadow-sm`}>
              {score}% Match
            </span>
            
            <button
              onClick={handleSave}
              className={`p-2 rounded-xl transition-all duration-200 border ${
                saved
                  ? "bg-primary/10 text-primary border-primary/20 scale-105"
                  : "text-stone-400 hover:text-stone-700 hover:bg-stone-100/80 border-transparent"
              }`}
            >
              <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-stone-900 text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {job.title}
        </h3>

        {/* Meta Line (Clean flat text) */}
        <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5 flex-wrap">
          <span>{job.location}</span>
          <span className="text-stone-300">•</span>
          <span className="capitalize">{job.jobType}</span>
        </div>

        {/* Salary */}
        <div className="text-sm font-extrabold text-stone-900">
          {formatSalary()}
        </div>

        {/* Skills Tags (Unified, beautiful layout) */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {job.skills.slice(0, 3).map((skill, sIdx) => {
            const hasSkill = userSkills.some(us => us.toLowerCase() === skill.toLowerCase());
            return (
              <Badge
                key={sIdx}
                variant="outline"
                className={`text-[9px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-lg transition-colors ${
                  hasSkill
                    ? "bg-primary/5 text-primary border-primary/20"
                    : "bg-white text-stone-500 border-stone-200/80"
                }`}
              >
                {skill}
              </Badge>
            );
          })}
          {job.skills.length > 3 && (
            <Badge variant="outline" className="text-[9px] font-black text-stone-450 bg-white border-stone-200/80 py-0.5 px-2 rounded-lg">
              +{job.skills.length - 3}
            </Badge>
          )}
        </div>
      </div>

      {/* Card Footer: Source and Action Buttons */}
      <div className="flex items-center justify-between border-t border-stone-100 pt-4 mt-5 relative z-10">
        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
          {job.sourceAttribution}
        </span>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(job);
            }}
            className="text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 h-8 cursor-pointer active:scale-95 transition-transform"
          >
            Details
          </Button>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(job.applyUrl, "_blank");
            }}
            className="group/apply text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-xl bg-primary text-white hover:bg-primary/95 flex items-center gap-1 shadow-md shadow-primary/10 active:scale-95 transition-transform h-8 cursor-pointer"
          >
            Apply <ExternalLink className="w-3.5 h-3.5 group-hover/apply:translate-x-0.5 group-hover/apply:-translate-y-0.5 transition-transform duration-200" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
