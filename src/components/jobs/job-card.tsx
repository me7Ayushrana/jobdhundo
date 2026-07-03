"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, MapPin, Briefcase, Calendar, DollarSign, ExternalLink, Sparkles } from "lucide-react";
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

  // Determine Match Score Color and Ring
  const score = job.matchScore ?? 0;
  const getScoreStyles = (s: number) => {
    if (s >= 90) return { text: "text-emerald-500", border: "border-emerald-500/30", bg: "bg-emerald-500/10", stroke: "#10b981" };
    if (s >= 70) return { text: "text-blue-500", border: "border-blue-500/30", bg: "bg-blue-500/10", stroke: "#3b82f6" };
    if (s >= 50) return { text: "text-amber-500", border: "border-amber-500/30", bg: "bg-amber-500/10", stroke: "#f59e0b" };
    return { text: "text-rose-500", border: "border-rose-500/30", bg: "bg-rose-500/10", stroke: "#f43f5e" };
  };
  const scoreStyle = getScoreStyles(score);

  // Time posted display
  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Posted today";
      if (diffDays === 1) return "Posted yesterday";
      return `Posted ${diffDays} days ago`;
    } catch (_) {
      return "Posted recently";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.3 }}
      onClick={() => onViewDetails(job)}
      className="group relative flex flex-col justify-between p-6 bg-white border border-black/5 rounded-2xl cursor-pointer hover:border-primary/20 transition-all overflow-hidden h-[330px] shadow-sm"
    >
      {/* Dynamic Backglow for Match Score */}
      {score >= 80 && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />
      )}

      <div>
        {/* Company and Save */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {job.companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.companyLogo} alt={job.company} className="w-9 h-9 rounded-lg object-contain bg-stone-50 p-1 border border-stone-100" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-stone-600 text-sm">
                {job.company.charAt(0)}
              </div>
            )}
            <span className="text-xs font-semibold text-stone-500 tracking-wide uppercase">{job.company}</span>
          </div>

          <button
            onClick={handleSave}
            className={`p-2 rounded-xl transition-all duration-300 ${
              saved
                ? "bg-primary/10 text-primary border border-primary/20 scale-105"
                : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent"
            }`}
          >
            <Bookmark className="w-4.5 h-4.5" fill={saved ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Title & Metadata */}
        <h3 className="font-bold text-stone-900 text-base leading-tight group-hover:text-primary transition-colors mb-2 line-clamp-2">
          {job.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-stone-500 font-medium mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{job.location}</span>
          </div>
          <span className="text-stone-300">•</span>
          <div className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="capitalize">{job.jobType}</span>
          </div>
        </div>

        {/* Salary & Details */}
        <div className="flex items-center justify-between py-2 border-y border-stone-50 mb-4 text-xs font-semibold">
          <div className="flex items-center text-stone-700">
            <DollarSign className="w-3.5 h-3.5 text-stone-400" />
            <span>{formatSalary()}</span>
          </div>
          <div className="flex items-center gap-1 text-stone-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{getRelativeTime(job.postedDate)}</span>
          </div>
        </div>

        {/* Skills Preview */}
        <div className="flex flex-wrap gap-1.5 mb-2 overflow-hidden max-h-[28px]">
          {job.skills.slice(0, 3).map((skill, sIdx) => {
            const hasSkill = userSkills.some(us => us.toLowerCase() === skill.toLowerCase());
            return (
              <Badge
                key={sIdx}
                variant="secondary"
                className={`text-[10px] py-0 px-2 rounded-full font-medium ${
                  hasSkill
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                }`}
              >
                {skill}
              </Badge>
            );
          })}
          {job.skills.length > 3 && (
            <span className="text-[10px] text-stone-400 font-semibold self-center ml-1">+{job.skills.length - 3}</span>
          )}
        </div>
      </div>

      {/* Footer: Circular Progress & Button */}
      <div className="flex items-center justify-between border-t border-stone-100 pt-4 mt-auto">
        {/* Circular Progress Match Score */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="12"
                className="stroke-stone-100"
                strokeWidth="2.5"
                fill="transparent"
              />
              <motion.circle
                cx="16"
                cy="16"
                r="12"
                stroke={scoreStyle.stroke}
                strokeWidth="2.5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 12}
                initial={{ strokeDashoffset: 2 * Math.PI * 12 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 12 * (1 - score / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <span className={`absolute text-[9px] font-black tracking-tighter ${scoreStyle.text}`}>
              {score}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider leading-none">DNA MATCH</span>
            <span className={`text-[10px] font-extrabold ${scoreStyle.text} leading-tight`}>
              {score >= 70 ? "High Compatibility" : "Moderate Compatibility"}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(job);
            }}
            className="text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700"
          >
            Details
          </Button>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(job);
            }}
            className="text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-xl bg-primary text-white hover:bg-primary/90 flex items-center gap-1 shadow-md shadow-primary/10 active:scale-95 transition-transform"
          >
            Apply <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Attribution */}
      <span className="absolute bottom-1 right-2 text-[8px] font-bold text-stone-400 uppercase tracking-widest pointer-events-none">
        {job.sourceAttribution}
      </span>
    </motion.div>
  );
}
