"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as Github, Search, Sparkles, Award, Compass, RefreshCw, BarChart2, Dna, CheckCircle2, ChevronRight, Upload, FileText } from "lucide-react";
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
      <div className="absolute inset-0 bg-grid pointer-events-none z-[1]" />

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        
        {!showResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[70vh]">
            
            {/* Left Action Pane */}
            <div className="lg:col-span-6 space-y-8 text-left">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-xs font-mono tracking-widest text-primary uppercase py-1.5 px-4 rounded-full">
                  INTELLIGENCE PROTOCOL
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-none text-stone-900">
                  Skill DNA <span className="text-primary">Extractor</span>
                </h1>
                <p className="text-sm text-stone-500 leading-relaxed font-semibold">
                  Deconstruct your engineering footprint. Scan your public code repositories or upload your resume to extract, structure, and index your developer DNA.
                </p>
              </div>

              {/* Premium Console Extractor Card */}
              <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border border-stone-850 p-6 rounded-[2.5rem] shadow-2xl space-y-6 max-w-md relative overflow-hidden group">
                {/* Subtle backglow gradient inside the card */}
                <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                
                {/* Tab Selection inside Console */}
                <div className="p-1 bg-stone-950/60 border border-stone-850 rounded-2xl flex gap-1 w-full relative z-10">
                  <button
                    onClick={() => { setActiveTab("github"); setError(null); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeTab === "github"
                        ? "bg-stone-800 text-white border border-stone-750 shadow-md"
                        : "text-stone-450 hover:text-stone-300"
                    }`}
                  >
                    <Github className="w-4 h-4" /> GitHub Scan
                  </button>
                  <button
                    onClick={() => { setActiveTab("resume"); setError(null); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeTab === "resume"
                        ? "bg-stone-800 text-white border border-stone-750 shadow-md"
                        : "text-stone-450 hover:text-stone-300"
                    }`}
                  >
                    <Upload className="w-4 h-4" /> Resume Upload
                  </button>
                </div>

                {/* Input action forms inside Console */}
                <div className="space-y-4 relative z-10">
                  {activeTab === "github" ? (
                    <div className="space-y-4">
                      <div className="p-2 bg-stone-950/40 border border-stone-850 rounded-2xl flex items-center gap-2">
                        <div className="flex-1 flex items-center px-4 gap-2.5 bg-stone-950/60 rounded-xl border border-stone-850 h-12">
                          <Github className="w-4 h-4 text-stone-500" />
                          <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="GitHub Username..."
                            className="bg-transparent border-none text-xs h-full text-white focus-visible:ring-0 placeholder:text-stone-500 font-semibold"
                            onKeyDown={(e) => e.key === "Enter" && runAnalysis()}
                          />
                        </div>
                        <Button
                          onClick={runAnalysis}
                          disabled={!username || isAnalyzing}
                          className="h-12 px-5 bg-primary hover:bg-primary/95 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer shrink-0 border-none"
                        >
                          {isAnalyzing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              Extract <ChevronRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="flex animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Button
                          variant="outline"
                          onClick={() => window.open("https://getmygit.vercel.app", "_blank")}
                          className="h-10 px-5 border-stone-800 text-stone-450 hover:text-white bg-stone-900/40 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-900 flex items-center gap-2 cursor-pointer transition-all border"
                        >
                          <Github className="w-3.5 h-3.5 text-primary" /> Analyzer Repository <ChevronRight className="w-3 h-3 text-stone-500" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-stone-950/40 border border-stone-850 rounded-2xl flex items-center gap-2">
                      <div className="flex-1 flex items-center px-4 gap-2.5 bg-stone-950/60 rounded-xl border border-stone-850 h-12 relative cursor-pointer group">
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.txt"
                          onChange={handleResumeUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <FileText className="w-4 h-4 text-stone-500 shrink-0" />
                        <span className="text-[11px] font-semibold text-stone-300 truncate">
                          {fileName ? fileName : "Upload CV file..."}
                        </span>
                      </div>
                      <Button
                        onClick={runAnalysis}
                        disabled={!fileName || isAnalyzing}
                        className="h-12 px-5 bg-primary hover:bg-primary/95 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border-none"
                      >
                        {isAnalyzing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            Parse <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Console footer tip */}
                <p className="text-[10px] text-stone-500 font-bold tracking-normal text-left border-t border-stone-850/60 pt-3 relative z-10">
                  💡 Scanner analyzes package files, dependencies, and CV text layers to compile matching indices.
                </p>
              </div>

              {/* Error messages */}
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-bold uppercase tracking-wider w-fit">
                  ⚠️ {error}
                </div>
              )}
            </div>

            {/* Right Graphic Pane (Wow factor!) */}
            <div className="lg:col-span-6 flex justify-center animate-in fade-in zoom-in-95 duration-700">
              <div className="relative p-3 bg-white border border-stone-200/80 rounded-[36px] shadow-lg max-w-md w-full overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/dna_analyzer_hero.png"
                  alt="Skill DNA Scanner"
                  className="w-full h-auto rounded-[28px] object-cover border border-stone-100 shadow-inner group-hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
            </div>

          </div>
        ) : (
          // Results Presentation
          <div className="space-y-10">
            {/* Redesigned Header on Results View */}
            <header className="flex justify-between items-center pb-6 border-b border-stone-200">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                  <Dna className="w-6 h-6 text-primary" /> Extraction Results
                </h1>
                <p className="text-xs text-stone-500 font-semibold">
                  Parsed tech stack footprints for {activeTab === "github" ? `@${username}` : fileName}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowResults(false)}
                className="text-xs font-bold uppercase py-2 px-4 rounded-xl border border-stone-250 hover:bg-stone-50"
              >
                Scan Again
              </Button>
            </header>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Stats & Breakdown */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Profile Card */}
                <Card className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                  <CardHeader className="p-0 pb-4 relative z-10">
                    <CardTitle className="text-xs font-black uppercase text-stone-400 tracking-widest flex items-center gap-1.5">
                      <Dna className="w-4 h-4 text-primary" /> Profile DNA Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                    <div className="p-4 bg-stone-550/40 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between h-28">
                      <span className="text-[9px] font-bold text-stone-450 uppercase tracking-widest">Extracted Tech Skills</span>
                      <span className="text-3xl font-black text-stone-900 mt-2">{skillsResult.length}</span>
                      <span className="text-[9px] text-stone-400 font-semibold mt-1">Unique skills and frameworks</span>
                    </div>

                    <div className="p-4 bg-stone-550/40 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between h-28">
                      <span className="text-[9px] font-bold text-stone-450 uppercase tracking-widest">Extraction Confidence</span>
                      <span className="text-3xl font-black text-emerald-600 mt-2">{confidence}%</span>
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
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 9, fontWeight: "bold" }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 8 }} />
                          <Radar name="Proficiency" dataKey="proficiency" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.15} />
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
                        <BarChart2 className="w-4 h-4 text-stone-450" /> Primary Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-wrap gap-1.5">
                      {topLanguages.map((lang, idx) => (
                        <Badge key={idx} variant="outline" className="bg-stone-50 text-stone-600 border-stone-200 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg">
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
                      <Award className="w-4 h-4 text-stone-450" /> Extracted Framework DNA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto">
                    {skillsResult.map((skill, idx) => (
                      <Badge key={idx} className="bg-primary/5 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-lg">
                        {skill}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>

                {/* Sync and Go Actions */}
                <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-3">
                  <Button
                    onClick={handleSyncProfile}
                    className="w-full font-black uppercase tracking-widest py-5 rounded-2xl bg-primary text-white hover:bg-primary/95 flex items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-95 transition-transform cursor-pointer h-12"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Sync to Builder Profile
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push(`/jobs?skills=${skillsResult.slice(0, 3).join(",")}`)}
                    className="w-full font-black uppercase tracking-wider py-5 rounded-2xl border-stone-250 hover:bg-stone-50 flex items-center justify-center gap-2 cursor-pointer h-12 text-[10px] text-stone-700"
                  >
                    <Compass className="w-4.5 h-4.5" /> Explore Matched Jobs
                  </Button>

                  <p className="text-[9px] font-bold text-stone-400 text-center leading-relaxed px-4 pt-1">
                    💡 Syncing writes these skills into your local profile. The Discovery Feed will immediately adjust calculations to match.
                  </p>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {isAnalyzing && (
            <div className="fixed inset-0 bg-stone-900/10 backdrop-blur-sm z-[999] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-10 text-center space-y-6 max-w-sm w-full mx-6 bg-white border border-stone-200 rounded-[32px] shadow-xl"
              >
                <div className="w-10 h-10 border-t-2 border-primary rounded-full mx-auto animate-spin" />
                <div className="space-y-2">
                  <motion.h4
                    key={analysisStep}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs font-black text-stone-900 uppercase tracking-widest"
                  >
                    {currentSteps[analysisStep]}
                  </motion.h4>
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Processing profiles...</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
