"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Briefcase, DollarSign, Calendar, SlidersHorizontal, ArrowUpDown, ChevronDown, Check, X, RefreshCw, Sparkles, Filter, AlertCircle } from "lucide-react";
import { useSocial } from "@/components/providers/social-context";
import { UnifiedJob, JobSearchResult, JobSearchFilters } from "@/lib/jobs/types";
import { calculateMatchScore } from "@/lib/jobs/match-scorer";
import { JobCard } from "@/components/jobs/job-card";
import { JobDetailsModal } from "@/components/jobs/job-details-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function JobsFeedInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useSocial();

  // Filters State
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [remoteOnly, setRemoteOnly] = useState(searchParams.get("remote") === "true");
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState<number>(0);
  const [salaryMax, setSalaryMax] = useState<number>(0);
  const [postedWithin, setPostedWithin] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"relevance" | "newest" | "salary">("relevance");

  // Multi-select skills filter
  const [skillSearch, setSkillSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    searchParams.get("skills") ? searchParams.get("skills")!.split(",") : []
  );

  // Pagination & Loading States
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [sourceBreakdown, setSourceBreakdown] = useState<Record<string, number>>({});
  const [isStale, setIsStale] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Modal Detail View State
  const [selectedJob, setSelectedJob] = useState<UnifiedJob | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  // Mobile Filters Panel state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Pre-defined values
  const jobTypesList = ["full-time", "part-time", "contract", "internship", "freelance"];
  const experienceList = ["entry", "mid", "senior", "lead", "executive"];
  const postedWithinList = [
    { label: "Anytime", value: "all" },
    { label: "Past 24 Hours", value: "24h" },
    { label: "Past 7 Days", value: "7d" },
    { label: "Past 30 Days", value: "30d" }
  ];

  // Load Saved Bookmarks from user profile or localstorage
  useEffect(() => {
    const saved = localStorage.getItem("devmatch_saved_jobs");
    if (saved) {
      try {
        setSavedJobIds(JSON.parse(saved));
      } catch (_) {}
    }
  }, []);

  const handleSaveJob = (job: UnifiedJob) => {
    let updated;
    if (savedJobIds.includes(job.id)) {
      updated = savedJobIds.filter(id => id !== job.id);
    } else {
      updated = [...savedJobIds, job.id];
    }
    setSavedJobIds(updated);
    localStorage.setItem("devmatch_saved_jobs", JSON.stringify(updated));
  };

  const fetchJobsData = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (location) params.set("location", location);
      if (remoteOnly) params.set("remote", "true");
      if (selectedJobTypes.length > 0) params.set("jobType", selectedJobTypes.join(","));
      if (selectedExperience.length > 0) params.set("experience", selectedExperience.join(","));
      if (selectedSkills.length > 0) params.set("skills", selectedSkills.join(","));
      if (salaryMin > 0) params.set("salaryMin", salaryMin.toString());
      if (salaryMax > 0) params.set("salaryMax", salaryMax.toString());
      if (postedWithin !== "all") params.set("postedWithin", postedWithin);
      params.set("page", pageNum.toString());
      params.set("perPage", "12");

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load jobs");
      const data: JobSearchResult = await res.json();

      // Compute match score client-side for dynamic precision based on current logged in user
      const userSkills = currentUser?.skills || ["React", "TypeScript", "Node.js"];
      const enrichedJobs = data.jobs.map(job => {
        const matchScore = calculateMatchScore(
          userSkills,
          job.skills,
          {
            preferredLocations: location ? [location] : [],
            minSalary: salaryMin,
            jobTypes: selectedJobTypes,
            remoteOnly: remoteOnly
          },
          job
        );
        return { ...job, matchScore };
      });

      // Sort
      if (sortBy === "relevance") {
        enrichedJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      } else if (sortBy === "salary") {
        enrichedJobs.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
      } else {
        enrichedJobs.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
      }

      if (append) {
        setJobs(prev => [...prev, ...enrichedJobs]);
      } else {
        setJobs(enrichedJobs);
      }

      setHasMore(data.hasMore);
      setTotalResults(data.totalResults);
      setSourceBreakdown(data.sourceBreakdown || {});
      setIsStale(!!(data as any).warning);
      setIsDemoMode(!!data.isDemoMode);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, location, remoteOnly, selectedJobTypes, selectedExperience, selectedSkills, salaryMin, salaryMax, postedWithin, sortBy, currentUser]);

  // Trigger search on filter changes
  useEffect(() => {
    setPage(1);
    fetchJobsData(1, false);
  }, [query, location, remoteOnly, selectedJobTypes, selectedExperience, selectedSkills, salaryMin, salaryMax, postedWithin, sortBy, fetchJobsData]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchJobsData(nextPage, true);
  };

  const handleToggleJobType = (type: string) => {
    setSelectedJobTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleToggleExperience = (exp: string) => {
    setSelectedExperience(prev =>
      prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]
    );
  };

  const handleAddSkill = (skill: string) => {
    if (skill.trim() && !selectedSkills.includes(skill.trim())) {
      setSelectedSkills(prev => [...prev, skill.trim()]);
    }
    setSkillSearch("");
  };

  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  };

  const handleClearFilters = () => {
    setQuery("");
    setLocation("");
    setRemoteOnly(false);
    setSelectedJobTypes([]);
    setSelectedExperience([]);
    setSelectedSkills([]);
    setSalaryMin(0);
    setSalaryMax(0);
    setPostedWithin("all");
  };

  return (
    <div className="relative min-h-screen bg-stone-50 pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Title area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              Job Dhundo! <Sparkles className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-xs text-stone-500 font-semibold mt-1">
              Showing {totalResults} curated software engineering opportunities
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => fetchJobsData(1, false)}
              className="p-2 bg-white rounded-full border border-stone-200 hover:border-primary/50 text-stone-400 hover:text-stone-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Warning Banner for offline backup */}
        {isStale && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl text-xs font-bold flex items-center justify-between">
            <span>⚠️ API rate limits hit. Serving cached offline results.</span>
            <Button variant="ghost" size="sm" onClick={() => fetchJobsData(1, false)} className="text-amber-500 hover:bg-amber-500/15 text-[10px] font-black uppercase">Retry</Button>
          </div>
        )}

        {isDemoMode && (
          <div className="bg-amber-50 border border-amber-250 rounded-2xl p-4 mb-6 flex flex-col gap-1 shadow-sm text-left">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
              <span>Demo Mode Active</span>
            </div>
            <p className="text-xs text-amber-700 font-semibold leading-relaxed">
              Showing sample listings. Configure API keys in environment variables for live job feeds from 50+ real sources.
            </p>
          </div>
        )}

        {/* Main Grid: Left filters sidebar, Right cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Desktop Left Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800/80 rounded-3xl p-6 shadow-xl sticky top-28 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-stone-800/80">
                <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Filter className="w-4.5 h-4.5" /> Filters
                </span>
                <button onClick={handleClearFilters} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">
                  Clear All
                </button>
              </div>

              {/* Keyword Search */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Title or company..."
                    className="pl-9 bg-stone-850/80 border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Location Input & Remote */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bangalore, India"
                      className="pl-9 bg-stone-850/80 border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-700 bg-stone-800 text-primary focus:ring-primary/40 focus:ring-offset-0"
                  />
                  <span>Remote Only</span>
                </label>
              </div>

              {/* Skills multi-select */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Skills Needed</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                  <Input
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill(skillSearch)}
                    placeholder="Add skill (React, Java...)"
                    className="pl-9 bg-stone-850/80 border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50 focus-visible:ring-offset-0"
                  />
                </div>
                
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedSkills.map((s, idx) => (
                      <Badge key={idx} className="bg-primary/10 text-primary border border-primary/20 text-[10px] py-0 px-2 rounded-full font-semibold flex items-center gap-1">
                        {s}
                        <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => handleRemoveSkill(s)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Type Checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Job Type</label>
                <div className="space-y-2">
                  {jobTypesList.map(type => (
                    <label key={type} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-300 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedJobTypes.includes(type)}
                        onChange={() => handleToggleJobType(type)}
                        className="w-4 h-4 rounded border-stone-700 bg-stone-800 text-primary focus:ring-primary/40 focus:ring-offset-0"
                      />
                      <span className="capitalize">{type.replace("-", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience level radios */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Experience Level</label>
                <div className="space-y-2">
                  {experienceList.map(exp => (
                    <label key={exp} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-300 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedExperience.includes(exp)}
                        onChange={() => handleToggleExperience(exp)}
                        className="w-4 h-4 rounded border-stone-700 bg-stone-800 text-primary focus:ring-primary/40 focus:ring-offset-0"
                      />
                      <span className="capitalize">{exp}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Recency posted dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Date Posted</label>
                <select
                  value={postedWithin}
                  onChange={(e) => setPostedWithin(e.target.value)}
                  className="w-full p-2.5 bg-stone-800/80 border border-stone-750 text-xs font-semibold rounded-xl text-stone-250 focus:outline-none focus:border-primary/55 cursor-pointer"
                >
                  {postedWithinList.map(item => (
                    <option key={item.value} value={item.value} className="bg-stone-900 text-white">{item.label}</option>
                  ))}
                </select>
              </div>

              {/* Salary Range */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Min Annual Salary</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2.5 top-3 w-3.5 h-3.5 text-stone-500" />
                    <Input
                      type="number"
                      value={salaryMin || ""}
                      onChange={(e) => setSalaryMin(parseInt(e.target.value, 10) || 0)}
                      placeholder="e.g. 50000"
                      className="pl-7 bg-stone-850/80 border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Panel: Feed cards */}
          <main className="lg:col-span-3 space-y-6">
            {/* Top Sort bar */}
            <div className="bg-gradient-to-r from-stone-900 to-stone-950 border border-stone-800/85 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-stone-300 font-bold">
                Showing {jobs.length} of {totalResults} results
              </span>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-stone-450 uppercase tracking-widest flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" /> Sort By:</span>
                <div className="flex gap-1 bg-stone-950/80 border border-stone-800/50 p-1 rounded-xl">
                  {[
                    { label: "DNA Match", val: "relevance" },
                    { label: "Newest", val: "newest" },
                    { label: "Salary", val: "salary" }
                  ].map(tab => (
                    <button
                      key={tab.val}
                      onClick={() => setSortBy(tab.val as any)}
                      className={`text-[10px] font-extrabold uppercase py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                        sortBy === tab.val
                          ? "bg-stone-800 text-primary shadow-sm"
                          : "text-stone-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                
                {/* Mobile Filter toggle */}
                <Button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-xl border border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-750"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Grid display */}
            {loading && jobs.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="h-[330px] rounded-2xl bg-stone-200/50 animate-pulse border border-stone-200/85" />
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    userSkills={currentUser?.skills || ["React", "TypeScript", "Node.js"]}
                    onViewDetails={(j) => setSelectedJob(j)}
                    onSave={handleSaveJob}
                    isSaved={savedJobIds.includes(job.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-16 text-center bg-white border border-stone-200/85 rounded-3xl space-y-4">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900">No jobs match your search</h3>
                <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto">
                  Try expanding your search query, selecting different filter attributes, or scanning your GitHub skills profile.
                </p>
                <Button onClick={handleClearFilters} className="bg-primary text-white font-bold text-xs uppercase py-2 px-6 rounded-xl shadow-md">
                  Reset All Filters
                </Button>
              </div>
            )}

            {/* Load More pagination button */}
            {hasMore && (
              <div className="pt-8 flex justify-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 py-3.5 px-8 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Load More Opportunities"}
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Slide-over Mobile Filters Sheet */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-[400] lg:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="relative bg-gradient-to-b from-stone-900 to-stone-950 w-full max-w-sm h-full shadow-2xl flex flex-col p-6 overflow-y-auto space-y-6 border-l border-stone-800"
            >
              <div className="flex justify-between items-center pb-4 border-b border-stone-800/80">
                <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Filter className="w-4.5 h-4.5" /> Filters
                </span>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Keyword Search */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Title or company..."
                    className="pl-9 bg-stone-850/80 border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Location Input & Remote */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bangalore, India"
                      className="pl-9 bg-stone-850/80 border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-700 bg-stone-800 text-primary focus:ring-primary/40 focus:ring-offset-0"
                  />
                  <span>Remote Only</span>
                </label>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Skills Needed</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                  <Input
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill(skillSearch)}
                    placeholder="Add skill (React, Java...)"
                    className="pl-9 bg-stone-850/80 border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50 focus-visible:ring-offset-0"
                  />
                </div>
                
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedSkills.map((s, idx) => (
                      <Badge key={idx} className="bg-primary/10 text-primary border border-primary/20 text-[10px] py-0 px-2 rounded-full font-semibold flex items-center gap-1">
                        {s}
                        <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => handleRemoveSkill(s)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Type Checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Job Type</label>
                <div className="space-y-2">
                  {jobTypesList.map(type => (
                    <label key={type} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-300 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedJobTypes.includes(type)}
                        onChange={() => handleToggleJobType(type)}
                        className="w-4 h-4 rounded border-stone-700 bg-stone-800 text-primary focus:ring-primary/40 focus:ring-offset-0"
                      />
                      <span className="capitalize">{type.replace("-", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience level radios */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Experience Level</label>
                <div className="space-y-2">
                  {experienceList.map(exp => (
                    <label key={exp} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-300 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedExperience.includes(exp)}
                        onChange={() => handleToggleExperience(exp)}
                        className="w-4 h-4 rounded border-stone-700 bg-stone-800 text-primary focus:ring-primary/40 focus:ring-offset-0"
                      />
                      <span className="capitalize">{exp}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Recency posted dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Date Posted</label>
                <select
                  value={postedWithin}
                  onChange={(e) => setPostedWithin(e.target.value)}
                  className="w-full p-2.5 bg-stone-800/80 border border-stone-750 text-xs font-semibold rounded-xl text-stone-250 focus:outline-none focus:border-primary/55 cursor-pointer"
                >
                  {postedWithinList.map(item => (
                    <option key={item.value} value={item.value} className="bg-stone-900 text-white">{item.label}</option>
                  ))}
                </select>
              </div>

              {/* Salary Range */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-450">Min Annual Salary</label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-3 w-3.5 h-3.5 text-stone-500" />
                  <Input
                    type="number"
                    value={salaryMin || ""}
                    onChange={(e) => setSalaryMin(parseInt(e.target.value, 10) || 0)}
                    placeholder="e.g. 50000"
                    className="pl-7 bg-stone-850/80 border-stone-800 text-stone-200 placeholder:text-stone-500 text-xs rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleClearFilters} variant="outline" className="flex-1 rounded-xl text-xs py-2 bg-transparent text-stone-300 border-stone-700 hover:bg-stone-800 hover:text-white">Reset</Button>
                <Button onClick={() => setIsMobileFiltersOpen(false)} className="flex-1 rounded-xl bg-primary text-white text-xs py-2 border-transparent">Apply Filters</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details View Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={selectedJob !== null}
        onClose={() => setSelectedJob(null)}
        userSkills={currentUser?.skills || ["React", "TypeScript", "Node.js"]}
        isSaved={selectedJob !== null && savedJobIds.includes(selectedJob.id)}
        onSave={handleSaveJob}
      />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 pt-36 pb-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin" />
        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Loading job feed...</span>
      </div>
    }>
      <JobsFeedInner />
    </Suspense>
  );
}
