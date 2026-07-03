"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Briefcase, Calendar, DollarSign, ExternalLink, Bookmark, Sparkles, Check, CheckCircle } from "lucide-react";
import { UnifiedJob } from "@/lib/jobs/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplicationWizard } from "@/components/jobs/application-wizard";

interface JobDetailsModalProps {
  job: UnifiedJob | null;
  isOpen: boolean;
  onClose: () => void;
  userSkills?: string[];
  isSaved?: boolean;
  onSave?: (job: UnifiedJob) => void;
}

export function JobDetailsModal({ job, isOpen, onClose, userSkills = [], isSaved = false, onSave }: JobDetailsModalProps) {
  const [isApplyWizardOpen, setIsApplyWizardOpen] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!job) return null;

  const score = job.matchScore ?? 0;
  const daysSincePosted = Math.floor((Date.now() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24));
  
  const formatSalary = () => {
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

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-stone-950/40 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative bg-white w-full max-w-5xl h-[85vh] rounded-3xl border border-black/5 shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Header Area */}
              <div className="p-6 md:p-8 border-b border-stone-100 flex justify-between items-start">
                <div className="flex gap-4 items-start pr-8">
                  {job.companyLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={job.companyLogo} alt={job.company} className="w-14 h-14 rounded-2xl object-contain bg-stone-50 border border-stone-100 p-1.5 mt-1" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center font-black text-stone-600 text-lg border border-stone-200 mt-1">
                      {job.company.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-stone-500">{job.company}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 bg-stone-50 text-stone-600 border-none">
                        {job.sourceAttribution}
                      </Badge>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-stone-900 leading-tight">
                      {job.title}
                    </h2>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Contents */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Description & Requirements */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> Job Description
                    </h3>
                    <div className="text-sm text-stone-600 leading-relaxed space-y-3 font-medium whitespace-pre-line">
                      {job.description}
                    </div>
                  </div>

                  {job.requirements && job.requirements.length > 0 && (
                    <div>
                      <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-3">
                        Key Qualifications
                      </h3>
                      <ul className="space-y-2">
                        {job.requirements.map((req, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2.5 text-sm text-stone-600 font-medium">
                            <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right Column: Metadata details, DNA Scorer, Skills Check */}
                <div className="space-y-6">
                  {/* Quick Info Box */}
                  <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-4">
                    <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">Opportunity Details</h4>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 text-stone-700 font-semibold">
                        <MapPin className="w-4.5 h-4.5 text-stone-400" />
                        <span>{job.location}</span>
                      </div>

                      <div className="flex items-center gap-3 text-stone-700 font-semibold capitalize">
                        <Briefcase className="w-4.5 h-4.5 text-stone-400" />
                        <span>{job.jobType} ({job.experienceLevel} level)</span>
                      </div>

                      <div className="flex items-center gap-3 text-stone-700 font-semibold">
                        <DollarSign className="w-4.5 h-4.5 text-stone-400" />
                        <span>{formatSalary()}</span>
                      </div>

                      <div className="flex items-center gap-3 text-stone-700 font-semibold">
                        <Calendar className="w-4.5 h-4.5 text-stone-400" />
                        <span>
                          {daysSincePosted === 0 ? "Posted today" : daysSincePosted === 1 ? "Posted yesterday" : `Posted ${daysSincePosted} days ago`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score DNA Box */}
                  <div className="p-5 rounded-2xl border border-primary/10 bg-primary/5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Skill DNA Match</span>
                      <h4 className="text-base font-black text-stone-900">
                        {score}% Compatibility
                      </h4>
                      <p className="text-xs text-stone-500 font-medium">
                        Based on your scanned skills profile
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-full border-4 border-primary/20 flex items-center justify-center font-black text-lg text-primary bg-white">
                      {score}
                    </div>
                  </div>

                  {/* Skills Analysis */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">Required Stack</h4>
                    <div className="space-y-2">
                      {job.skills.map((skill, sIdx) => {
                        const hasSkill = userSkills.some(us => us.toLowerCase() === skill.toLowerCase());
                        return (
                          <div key={sIdx} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-xl bg-stone-50 border border-stone-100">
                            <span className="font-semibold text-stone-800">{skill}</span>
                            {hasSkill ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] py-0 px-2 rounded-full font-bold flex items-center gap-0.5">
                                <CheckCircle className="w-2.5 h-2.5" /> Have
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-stone-400 text-[10px] py-0 px-2 rounded-full font-bold">
                                Missing
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="p-6 border-t border-stone-100 bg-stone-50 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => onSave?.(job)}
                  className={`flex items-center gap-1.5 font-bold uppercase tracking-wider py-5 px-6 rounded-2xl transition-all border-stone-200 dark:border-stone-800 ${
                    isSaved ? "bg-primary/10 text-primary border-primary/20" : ""
                  }`}
                >
                  <Bookmark className="w-4.5 h-4.5" fill={isSaved ? "currentColor" : "none"} />
                  {isSaved ? "Saved" : "Save Job"}
                </Button>

                <Button
                  onClick={() => setIsApplyWizardOpen(true)}
                  className="flex items-center gap-1.5 font-black uppercase tracking-widest py-5 px-8 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/15 transition-all duration-300"
                >
                  Quick Apply <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ApplicationWizard
        isOpen={isApplyWizardOpen}
        onClose={() => setIsApplyWizardOpen(false)}
        job={job}
        onSuccess={onClose}
      />
    </>
  );
}
