"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Bookmark,
  Send,
  Sparkles,
  Award,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  FileText,
  MapPin,
  ExternalLink
} from "lucide-react";
import { useSocial } from "@/components/providers/social-context";
import { UnifiedJob } from "@/lib/jobs/types";
import { HIGH_FIDELITY_FALLBACK_JOBS } from "@/lib/jobs/mock-data";
import { calculateMatchScore } from "@/lib/jobs/match-scorer";
import { JobCard } from "@/components/jobs/job-card";
import { JobDetailsModal } from "@/components/jobs/job-details-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar
} from "recharts";

interface Application {
  id: string;
  company: string;
  role: string;
  status: "applied" | "interviewing" | "offer" | "rejected";
  date: string;
  notes: string;
}

const SKILL_MARKET_DATA = [
  { subject: "React", user: 90, market: 95 },
  { subject: "TypeScript", user: 80, market: 90 },
  { subject: "Node.js", user: 70, market: 85 },
  { subject: "Go", user: 30, market: 60 },
  { subject: "AWS", user: 45, market: 75 },
  { subject: "Tailwind CSS", user: 95, market: 85 }
];

const SALARY_INSIGHTS_DATA = {
  "Full Stack": [
    { location: "Bangalore", min: 15, max: 32 },
    { location: "Remote (Global)", min: 55, max: 110 },
    { location: "San Francisco", min: 110, max: 190 },
    { location: "London", min: 55, max: 95 }
  ],
  "Frontend": [
    { location: "Bangalore", min: 12, max: 26 },
    { location: "Remote (Global)", min: 45, max: 95 },
    { location: "San Francisco", min: 95, max: 165 },
    { location: "London", min: 48, max: 80 }
  ],
  "Backend": [
    { location: "Bangalore", min: 16, max: 35 },
    { location: "Remote (Global)", min: 58, max: 125 },
    { location: "San Francisco", min: 115, max: 200 },
    { location: "London", min: 58, max: 105 }
  ],
  "DevOps": [
    { location: "Bangalore", min: 18, max: 38 },
    { location: "Remote (Global)", min: 65, max: 130 },
    { location: "San Francisco", min: 120, max: 210 },
    { location: "London", min: 62, max: 115 }
  ]
};

export default function DashboardPage() {
  const { currentUser } = useSocial();
  const [activeTab, setActiveTab] = useState<"feed" | "saved" | "applications" | "skills" | "salary">("feed");

  // Job Listing detail trigger
  const [selectedJob, setSelectedJob] = useState<UnifiedJob | null>(null);

  // States
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<UnifiedJob[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedSalaryRole, setSelectedSalaryRole] = useState<"Full Stack" | "Frontend" | "Backend" | "DevOps">("Full Stack");

  // Application form states
  const [appCompany, setAppCompany] = useState("");
  const [appRole, setAppRole] = useState("");
  const [appStatus, setAppStatus] = useState<Application["status"]>("applied");
  const [appNotes, setAppNotes] = useState("");
  const [showAddAppForm, setShowAddAppForm] = useState(false);

  // Load persistence details
  useEffect(() => {
    // 1. Saved Bookmarks
    const saved = localStorage.getItem("devmatch_saved_jobs");
    if (saved) {
      try {
        setSavedJobIds(JSON.parse(saved));
      } catch (_) {}
    }

    // 2. Applications Trackers
    const apps = localStorage.getItem("devmatch_applications");
    if (apps) {
      try {
        setApplications(JSON.parse(apps));
      } catch (_) {}
    } else {
      // Seed fallback application for demonstration
      const seedApps: Application[] = [
        {
          id: "app-seed-1",
          company: "Vercel",
          role: "Senior Full Stack Engineer",
          status: "interviewing",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          notes: "Had a great screening round. Technical interview scheduled for next Tuesday."
        }
      ];
      setApplications(seedApps);
      localStorage.setItem("devmatch_applications", JSON.stringify(seedApps));
    }
  }, []);

  // Sync saved jobs and compute feed recommendations
  useEffect(() => {
    // Fetch live feed matched exactly to user skills
    const userSkills = currentUser?.skills || ["React", "TypeScript", "Node.js"];
    
    // In dev match fallback database, score and sort all listings
    const matched = HIGH_FIDELITY_FALLBACK_JOBS.map(job => {
      const matchScore = calculateMatchScore(
        userSkills,
        job.skills,
        { preferredLocations: [], minSalary: 0, jobTypes: [], remoteOnly: false },
        job
      );
      return { ...job, matchScore };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    setRecommendedJobs(matched);
  }, [currentUser]);

  // Derived Saved Jobs list
  const savedJobs = useMemo(() => {
    return recommendedJobs.filter(job => savedJobIds.includes(job.id));
  }, [recommendedJobs, savedJobIds]);

  const handleSaveToggle = (job: UnifiedJob) => {
    let updated;
    if (savedJobIds.includes(job.id)) {
      updated = savedJobIds.filter(id => id !== job.id);
    } else {
      updated = [...savedJobIds, job.id];
    }
    setSavedJobIds(updated);
    localStorage.setItem("devmatch_saved_jobs", JSON.stringify(updated));
  };

  // Add application tracker
  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appCompany.trim() || !appRole.trim()) return;

    const newApp: Application = {
      id: `app-${Date.now()}`,
      company: appCompany.trim(),
      role: appRole.trim(),
      status: appStatus,
      date: new Date().toISOString().split("T")[0],
      notes: appNotes.trim()
    };

    const updated = [newApp, ...applications];
    setApplications(updated);
    localStorage.setItem("devmatch_applications", JSON.stringify(updated));

    // Reset Form
    setAppCompany("");
    setAppRole("");
    setAppStatus("applied");
    setAppNotes("");
    setShowAddAppForm(false);
  };

  // Delete application tracker
  const handleDeleteApplication = (id: string) => {
    const updated = applications.filter(a => a.id !== id);
    setApplications(updated);
    localStorage.setItem("devmatch_applications", JSON.stringify(updated));
  };

  // Update application status
  const handleUpdateAppStatus = (id: string, newStatus: Application["status"]) => {
    const updated = applications.map(a => a.id === id ? { ...a, status: newStatus } : a);
    setApplications(updated);
    localStorage.setItem("devmatch_applications", JSON.stringify(updated));
  };

  return (
    <div className="relative min-h-screen bg-stone-50 pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-7xl space-y-8">
        
        {/* Title Block */}
        <div className="space-y-4">
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-xs font-mono tracking-widest text-primary overflow-hidden relative">
            <span className="relative z-10 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> COMMAND CENTER
            </span>
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-stone-900">
            Job Command <span className="text-stone-400 italic font-medium">Center</span>
          </h1>
          <p className="text-sm text-stone-500 max-w-md leading-relaxed">
            Monitor matched feeds, bookmark prospects, track recruiters, and analyze market parameters.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex overflow-x-auto pb-2 border-b border-stone-200 gap-2">
          {[
            { id: "feed", label: "My Feed", icon: Briefcase },
            { id: "saved", label: "Saved Jobs", icon: Bookmark },
            { id: "applications", label: "Track Applications", icon: Send },
            { id: "skills", label: "Skill DNA Analytics", icon: Award },
            { id: "salary", label: "Salary Insights", icon: DollarSign }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg shadow-primary/10"
                    : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* 1. MY FEED */}
            {activeTab === "feed" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">Recommended for your DNA</h3>
                  <Badge variant="outline" className="text-[10px] font-bold text-stone-500 py-0.5 rounded-full border-none bg-stone-100">
                    Matches sorted by score
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {recommendedJobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      userSkills={currentUser?.skills || ["React", "TypeScript", "Node.js"]}
                      onViewDetails={(j) => setSelectedJob(j)}
                      onSave={handleSaveToggle}
                      isSaved={savedJobIds.includes(job.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 2. SAVED JOBS */}
            {activeTab === "saved" && (
              <div className="space-y-6">
                <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">Bookmarked Positions</h3>
                {savedJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {savedJobs.map(job => (
                      <JobCard
                        key={job.id}
                        job={job}
                        userSkills={currentUser?.skills || ["React", "TypeScript", "Node.js"]}
                        onViewDetails={(j) => setSelectedJob(j)}
                        onSave={handleSaveToggle}
                        isSaved={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-16 text-center bg-white border border-black/5 rounded-3xl space-y-4">
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-stone-900">No bookmarked jobs</h3>
                    <p className="text-xs text-stone-500 font-medium max-w-xs mx-auto">
                      Click the bookmark icon on any job card inside the discovery feed to save it here for tracking.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. APPLICATIONS TRACKER */}
            {activeTab === "applications" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Applications list */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">Active Applications</h3>
                    <Button
                      onClick={() => setShowAddAppForm(!showAddAppForm)}
                      className="text-[10px] font-black uppercase tracking-widest py-1.5 px-3 bg-primary text-white rounded-xl shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Job
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {applications.length > 0 ? (
                      applications.map(app => (
                        <div
                          key={app.id}
                          className="p-5 bg-white border border-black/5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-stone-200 transition-all"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{app.company}</span>
                            <h4 className="font-bold text-stone-900 text-base leading-tight mt-0.5">{app.role}</h4>
                            <div className="flex items-center gap-4 text-xs font-semibold text-stone-500 mt-2">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Added {app.date}</span>
                              {app.notes && <span className="italic line-clamp-1 max-w-[280px]">"{app.notes}"</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Status selectors */}
                            <select
                              value={app.status}
                              onChange={(e) => handleUpdateAppStatus(app.id, e.target.value as any)}
                              className={`p-2 border rounded-xl text-xs font-bold ${
                                app.status === "offer"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : app.status === "interviewing"
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                  : app.status === "rejected"
                                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                  : "bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800"
                              }`}
                            >
                              <option value="applied">Applied</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="offer">Offer Received</option>
                              <option value="rejected">Rejected</option>
                            </select>

                            <button
                              onClick={() => handleDeleteApplication(app.id)}
                              className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center bg-white border border-black/5 rounded-3xl space-y-4">
                        <FileText className="w-10 h-10 text-stone-300 mx-auto" />
                        <h4 className="text-sm font-bold text-stone-900">No active applications tracked</h4>
                        <p className="text-xs text-stone-400 max-w-xs mx-auto">Click "Add Job" to record external recruiter cycles or direct apply processes.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Application Form Panel */}
                <div className="lg:col-span-1">
                  <AnimatePresence>
                    {(showAddAppForm || applications.length === 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm space-y-4"
                      >
                        <h4 className="text-xs font-black uppercase tracking-widest text-stone-900 pb-3 border-b border-stone-100">
                          Track New Application
                        </h4>

                        <form onSubmit={handleAddApplication} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Company Name</label>
                            <Input
                              required
                              value={appCompany}
                              onChange={(e) => setAppCompany(e.target.value)}
                              placeholder="e.g. Google"
                              className="bg-stone-50 border-stone-250 text-xs rounded-xl"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Job Title</label>
                            <Input
                              required
                              value={appRole}
                              onChange={(e) => setAppRole(e.target.value)}
                              placeholder="e.g. Frontend Developer"
                              className="bg-stone-50 border-stone-250 text-xs rounded-xl"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Initial Status</label>
                            <select
                              value={appStatus}
                              onChange={(e) => setAppStatus(e.target.value as any)}
                              className="w-full p-2.5 bg-stone-50 border border-stone-200 text-xs font-semibold rounded-xl text-stone-700"
                            >
                              <option value="applied">Applied</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="offer">Offer Received</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Notes & Logs</label>
                            <textarea
                              value={appNotes}
                              onChange={(e) => setAppNotes(e.target.value)}
                              placeholder="Key milestones, tech interview dates, or recruiter contact details..."
                              className="w-full h-20 p-3 bg-stone-50 border border-stone-200 text-xs rounded-xl font-medium text-stone-750 focus:outline-none"
                            />
                          </div>

                          <Button type="submit" className="w-full bg-primary text-white text-xs font-black uppercase tracking-widest py-4 rounded-xl shadow-md">
                            Save Application Log
                          </Button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            )}

            {/* 4. SKILL DNA ANALYTICS */}
            {activeTab === "skills" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Chart Block */}
                <Card className="lg:col-span-2 bg-white border-black/5 rounded-3xl p-6 shadow-sm">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-base font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" /> Skill Profile vs Market Demand
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Radar map comparing your scanned capabilities against aggregate hiring requirements.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={SKILL_MARKET_DATA}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 8 }} />
                        <Radar name="Your Skill DNA" dataKey="user" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                        <Radar name="Market Requirement" dataKey="market" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.1} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Analytical Breakdown */}
                <div className="space-y-6">
                  <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-stone-400">Skill Gap Diagnosis</h4>
                    
                    <div className="space-y-4 text-xs font-semibold">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl space-y-1">
                        <h5 className="font-extrabold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> High-Density Mastery</h5>
                        <p className="text-[11px] leading-relaxed">
                          Your **React** and **Tailwind CSS** levels exceed 90% of market benchmarks, putting you in the top tier for client-side architectures.
                        </p>
                      </div>

                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl space-y-1">
                        <h5 className="font-extrabold flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Core Growth Focus</h5>
                        <p className="text-[11px] leading-relaxed">
                          Hiring indices show growing demand for **Go** and **AWS** platforms. Upgrading these skills will increase your matches by 35%.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 5. SALARY INSIGHTS */}
            {activeTab === "salary" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Bar chart panel */}
                <Card className="lg:col-span-2 bg-white border-black/5 rounded-3xl p-6 shadow-sm">
                  <CardHeader className="p-0 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-base font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" /> Salary Range Insights
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Median annual range for target positions by location (Lakhs INR / Thousands USD).
                      </CardDescription>
                    </div>

                    <select
                      value={selectedSalaryRole}
                      onChange={(e) => setSelectedSalaryRole(e.target.value as any)}
                      className="p-2 bg-stone-50 border border-stone-250 text-xs font-bold rounded-xl text-stone-700 focus:outline-none"
                    >
                      <option value="Full Stack">Full Stack Dev</option>
                      <option value="Frontend">Frontend Dev</option>
                      <option value="Backend">Backend Dev</option>
                      <option value="DevOps">DevOps Engineer</option>
                    </select>
                  </CardHeader>
                  <CardContent className="p-0 h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={SALARY_INSIGHTS_DATA[selectedSalaryRole]} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="location" tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }} />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                        <Bar name="Lower Bracket" dataKey="min" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                        <Bar name="Median Bracket" dataKey="max" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Analytical breakdown */}
                <div className="space-y-6">
                  <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-stone-400">Market Insights</h4>
                    
                    <div className="space-y-4 text-xs font-semibold text-stone-700">
                      <div className="flex justify-between items-center py-2 border-b border-stone-100">
                        <span>Role Selection</span>
                        <span className="font-extrabold text-primary">{selectedSalaryRole}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-stone-100">
                        <span>Top Paying Geo</span>
                        <span>San Francisco</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-stone-100">
                        <span>Remote Index</span>
                        <span className="text-emerald-500 font-extrabold">Strong demand (42%)</span>
                      </div>
                      <p className="text-[11px] font-medium text-stone-500 leading-relaxed pt-2">
                        💡 **Negotiation Tip**: When targeting Remote roles, reference global currency scales. Organizations frequently budget on mid-tier USD brackets ($60k–$100k) regardless of local boundaries.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Details View Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={selectedJob !== null}
        onClose={() => setSelectedJob(null)}
        userSkills={currentUser?.skills || ["React", "TypeScript", "Node.js"]}
        isSaved={selectedJob !== null && savedJobIds.includes(selectedJob.id)}
        onSave={handleSaveToggle}
      />
    </div>
  );
}
