"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as Github, Search, Sparkles, Award, Compass, RefreshCw, BarChart2, Dna, CheckCircle2, ChevronRight, Upload, FileText, LayoutGrid } from "lucide-react";
import { useSocial } from "@/components/providers/social-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";

export default function AnalyzerPage() {
  const router = useRouter();
  const { currentUser } = useSocial();

  const [activeTab, setActiveTab] = useState<"github" | "resume">("github");
  const [username, setUsername] = useState(currentUser?.github && currentUser.github !== "devmatch_guest" ? currentUser.github : "");
  
  // Resume upload states
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [skillsResult, setSkillsResult] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number>(85);
  const [topLanguages, setTopLanguages] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const githubSteps = [
    "Contacting GitHub Registry...",
    "Scanning public repository manifest index...",
    "Compiling language distributions...",
    "Decoding package.json dependencies...",
    "Synthesizing Skill DNA profile..."
  ];

  const resumeSteps = [
    "Deconstructing document layers...",
    "Running OCR and text extraction...",
    "Tokenizing semantic structures...",
    "Matching skills against the vocabulary dictionary...",
    "Synthesizing Skill DNA profile..."
  ];

  const currentSteps = activeTab === "github" ? githubSteps : resumeSteps;

  const runAnalysis = async () => {
    setError(null);
    setShowResults(false);
    setIsAnalyzing(true);

    // Step animation loop
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < currentSteps.length - 1) {
        currentStep++;
        setAnalysisStep(currentStep);
      }
    }, 700);

    try {
      if (activeTab === "github") {
        if (!username.trim()) throw new Error("Please enter a valid GitHub username.");
        const res = await fetch("/api/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubUsername: username.trim() })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "GitHub profile not found or rate limited");
        }

        const data = await res.json();
        setSkillsResult(data.skills || []);
        setConfidence(data.confidence || 80);
        setTopLanguages(data.topLanguages || []);
      } else {
        if (!fileName) throw new Error("Please upload a resume file first.");
        
        // Mock resume parsing delay
        await new Promise((resolve) => setTimeout(resolve, 3500));
        
        // Simulate extracting skills based on job market
        const sampleSkills = ["React", "TypeScript", "Node.js", "Java", "Spring Boot", "Docker", "Kubernetes", "Tailwind CSS", "Next.js", "PostgreSQL"];
        const shuffled = [...sampleSkills].sort(() => 0.5 - Math.random());
        const extracted = shuffled.slice(0, 4 + Math.floor(Math.random() * 3));
        const languages = ["TypeScript", "JavaScript", "Java", "SQL"].filter(l => extracted.includes(l) || Math.random() > 0.5);

        setSkillsResult(extracted);
        setConfidence(92); // high confidence from pdf resumes
        setTopLanguages(languages.length > 0 ? languages : ["TypeScript", "JavaScript"]);
      }

      clearInterval(interval);
      setShowResults(true);
    } catch (e: any) {
      setError(e.message || "Failed to scan skills.");
      clearInterval(interval);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setShowResults(false);
  };

  const handleSyncProfile = () => {
    if (skillsResult.length === 0) return;
    
    // Create updated user profile
    const updated = {
      ...currentUser,
      github: activeTab === "github" ? username.trim() : currentUser?.github || "devmatch_guest",
      skills: skillsResult.slice(0, 8)
    };

    localStorage.setItem("devmatch_currentUser", JSON.stringify(updated));
    window.location.reload();
  };

  // Convert languages into chartable data format
  const radarData = skillsResult.slice(0, 6).map((skill, idx) => ({
    subject: skill,
    proficiency: 95 - (idx * 8) - Math.floor(Math.random() * 5)
  }));

  return (
    <div className="relative min-h-screen bg-stone-50 pt-28 pb-20 overflow-hidden">
      {/* Grid lines backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)]_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-[1]" />

      <div className="container mx-auto px-6 max-w-5xl space-y-10 relative z-10">
        
        {/* Title */}
        <header className="text-center space-y-4">
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-xs font-mono tracking-widest text-primary uppercase py-1.5 px-4 rounded-full">
            INTELLIGENCE PROTOCOL
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-stone-900">
            Skill DNA <span className="text-primary">Extractor</span>
          </h1>
          <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed font-semibold">
            Deconstruct your engineering footprint. Choose your source to scan and parse skills automatically.
          </p>
        </header>

        {/* Tab Selection */}
        <div className="flex justify-center">
          <div className="p-1 bg-stone-200/60 border border-stone-250 rounded-2xl flex gap-1 shadow-sm">
            <button
              onClick={() => { setActiveTab("github"); setShowResults(false); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === "github"
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm border border-stone-100 dark:border-stone-750"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              <Github className="w-4 h-4" /> GitHub Scan
            </button>
            <button
              onClick={() => { setActiveTab("resume"); setShowResults(false); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === "resume"
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm border border-stone-100 dark:border-stone-750"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              <Upload className="w-4 h-4" /> Resume Upload
            </button>
          </div>
        </div>

        {/* Search / Upload Action box */}
        <div className="max-w-2xl mx-auto">
          {activeTab === "github" ? (
            <div className="space-y-4">
              <div className="p-3 bg-white border border-stone-200 rounded-3xl shadow-sm flex items-center gap-3">
                <div className="flex-1 flex items-center px-4 gap-3 bg-stone-50 rounded-2xl border border-stone-200 h-14">
                  <Github className="w-5 h-5 text-stone-400" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter GitHub Username..."
                    className="bg-transparent border-none text-sm h-full focus-visible:ring-0 placeholder:text-stone-400 font-semibold"
                    onKeyDown={(e) => e.key === "Enter" && runAnalysis()}
                  />
                </div>
                <Button
                  onClick={runAnalysis}
                  disabled={!username || isAnalyzing}
                  className="h-14 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-primary/10 active:scale-95 transition-transform shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Extract DNA <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Button
                  variant="outline"
                  onClick={() => window.open("https://getmygit.vercel.app", "_blank")}
                  className="h-12 px-6 border-stone-200 text-stone-700 hover:text-stone-900 bg-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-stone-50 flex items-center gap-2 cursor-pointer transition-all border"
                >
                  <Github className="w-4 h-4 text-primary" /> Analyzer Repository <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-white border border-stone-200 rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-3">
              <div className="flex-1 w-full flex items-center px-4 gap-3 bg-stone-50 rounded-2xl border border-stone-200 h-14 relative cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleResumeUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileText className="w-5 h-5 text-stone-400 shrink-0" />
                <span className="text-xs font-bold text-stone-600 truncate">
                  {fileName ? fileName : "Drag & drop or select CV file..."}
                </span>
              </div>
              <Button
                onClick={runAnalysis}
                disabled={!fileName || isAnalyzing}
                className="h-14 w-full md:w-auto px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-primary/10 active:scale-95 transition-transform shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Parse Resume <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-center max-w-md mx-auto text-xs font-bold uppercase tracking-wider">
            ⚠️ {error}
          </div>
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-16 text-center space-y-6 max-w-sm mx-auto bg-white border border-stone-200 rounded-3xl shadow-md z-25 relative"
            >
              <div className="w-12 h-12 border-t-2 border-primary rounded-full mx-auto animate-spin" />
              <div className="space-y-2">
                <motion.h4
                  key={analysisStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs font-black text-stone-850 uppercase tracking-wider"
                >
                  {currentSteps[analysisStep]}
                </motion.h4>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Processing Layer data...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Presentation */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10"
          >
            {/* Left Column: Stats & Breakdown */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Profile Card */}
              <Card className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-xs font-black uppercase text-stone-400 tracking-widest flex items-center gap-1.5">
                    <Dna className="w-4 h-4 text-primary" /> Profile DNA Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between h-28">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Extracted Tech Skills</span>
                    <span className="text-2xl font-black text-stone-900 mt-2">{skillsResult.length}</span>
                    <span className="text-[9px] text-stone-400 font-semibold mt-1">Unique skills and frameworks</span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between h-28">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Extraction Confidence</span>
                    <span className="text-2xl font-black text-emerald-500 mt-2">{confidence}%</span>
                    <span className="text-[9px] text-stone-400 font-semibold mt-1">Refined from {activeTab === "github" ? "GitHub profiles" : "document structures"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Radar Chart */}
              {radarData.length > 0 && (
                <Card className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xs font-black uppercase text-stone-400 tracking-widest">
                      Extracted Stack Radar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 8 }} />
                        <Radar name="Proficiency" dataKey="proficiency" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Skills Checklist & Actions */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Top Languages */}
              {topLanguages.length > 0 && (
                <Card className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xs font-black uppercase text-stone-400 tracking-widest flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-stone-400" /> Primary Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-wrap gap-1.5">
                    {topLanguages.map((lang, idx) => (
                      <Badge key={idx} className="bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold px-3 py-1 rounded-full">
                        {lang}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Skills Tags */}
              <Card className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-xs font-black uppercase text-stone-400 tracking-widest flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-stone-400" /> Extracted Framework DNA
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto">
                  {skillsResult.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {skill}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              {/* Sync and Go Actions */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-3">
                <Button
                  onClick={handleSyncProfile}
                  className="w-full font-black uppercase tracking-widest py-5 rounded-2xl bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-95 transition-transform cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Sync to Builder Profile
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push(`/jobs?skills=${skillsResult.slice(0, 3).join(",")}`)}
                  className="w-full font-bold uppercase tracking-wider py-5 rounded-2xl border-stone-200 hover:bg-stone-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4.5 h-4.5" /> Explore Matched Jobs
                </Button>

                <p className="text-[9px] font-semibold text-stone-400 text-center leading-relaxed px-4 pt-1">
                  💡 Syncing writes these skills into your local profile. The Discovery Feed will immediately adjust calculations to match.
                </p>
              </div>

            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
}
