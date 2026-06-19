"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Shield, Users, Code, Sparkles, Terminal, Rocket, CheckCircle2, ChevronRight } from "lucide-react";
import { FeatureRoadmap } from "@/components/ui/feature-roadmap";

export default function Home() {
  const [demoUrl, setDemoUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const router = useRouter();

  const loadingSteps = [
    "Decrypting codebase DNA...",
    "Mapping architectural flow...",
    "Synthesizing optimal squad...",
  ];

  const handleDemo = async () => {
    setIsAnalyzing(true);
    for (let i = 0; i < loadingSteps.length; i++) {
      setAnalysisStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    if (demoUrl) {
      router.push(`/analyzer?url=${encodeURIComponent(demoUrl)}&demo=true`);
    } else {
      router.push(`/analyzer?demo=true`);
    }
  };

  const mockProjectDetails = {
    name: "github.com/me7Ayushrana/WorkstackAI",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Drizzle ORM"],
    type: "Collaboration Platform",
    roles: [
      { role: "Frontend Lead", match: "98%", name: "Ayush Rana" },
      { role: "ML Engineer", match: "94%", name: "Clara M." },
      { role: "DevOps Architect", match: "89%", name: "Kenji T." }
    ]
  };

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground selection:bg-primary/20">
      
      {/* Editorial Hero Area */}
      <section className="relative pt-44 pb-24 container mx-auto px-6 max-w-7xl flex flex-col items-center text-center">
        
        {/* Editorial Subtitle Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] rounded-full border border-primary/25 bg-primary/5 text-primary">
            <Zap className="w-3.5 h-3.5" /> AI-Powered Teammate Matcher
          </span>
        </motion.div>

        {/* Premium Bold Heading (No Gradients) */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-foreground"
        >
          Match Teammates.<br />
          <span className="text-primary">Build Squads.</span>
        </motion.h1>

        {/* Clean Editorial Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed font-medium"
        >
          Streamline team formation and maximize build productivity. DevMatch parses repository architectures to instantly match you with developers possessing the exact skills your codebase requires.
        </motion.p>

        {/* Premium Solid Input Search Box (No Gradients) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-2xl mx-auto mb-16 relative z-10"
        >
          <div className="p-2 bg-card border border-border rounded-3xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-sm focus-within:border-primary transition-all duration-300">
            <div className="flex-1 flex items-center px-6 gap-3">
              <Terminal className="w-5 h-5 text-muted-foreground shrink-0" />
              <Input
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="Paste GitHub Repository URL to test..."
                className="bg-transparent border-none text-foreground focus-visible:ring-0 placeholder:text-muted-foreground/60 h-12 text-base font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleDemo()}
              />
            </div>
            <Button
              onClick={handleDemo}
              disabled={isAnalyzing}
              className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              {isAnalyzing ? (
                <Zap className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Scan Codebase <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Simple Mock Dashboard Preview instead of Floating Spheres */}
          <AnimatePresence>
            {!isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12 w-full max-w-4xl mx-auto text-left"
              >
                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border pb-6 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase">Analysis Blueprint</span>
                    </div>
                    <span className="text-xs font-mono text-primary font-bold">{mockProjectDetails.name}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Tech details */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/60">Project Blueprint</span>
                        <h4 className="text-lg font-black text-foreground mt-1">{mockProjectDetails.type}</h4>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/60">Languages & Tools</span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {mockProjectDetails.stack.map(s => (
                            <Badge key={s} variant="secondary" className="bg-secondary text-foreground border border-border font-mono text-[10px]">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Teammates suggestions */}
                    <div className="col-span-2 space-y-4">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/60">Identified Squad Roles</span>
                      <div className="space-y-2.5">
                        {mockProjectDetails.roles.map(r => (
                          <div key={r.role} className="flex items-center justify-between bg-background border border-border/60 rounded-xl p-3.5 hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs font-black text-foreground">{r.role}</div>
                                <div className="text-[10px] font-medium text-muted-foreground">{r.name}</div>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-extrabold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                              {r.match} MATCH
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Smart Loading Overlay */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md"
            >
              <div className="text-center space-y-6 max-w-sm">
                <div className="w-16 h-16 border-t-2 border-primary rounded-full mx-auto animate-spin" />
                <div className="space-y-2">
                  <motion.h4
                    key={analysisStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg font-black tracking-tight text-foreground"
                  >
                    {loadingSteps[analysisStep]}
                  </motion.h4>
                  <p className="text-xs text-muted-foreground">This will take a moment. Running code heuristics...</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <Link href="/matches">
            <Button className="h-14 px-8 text-sm font-black uppercase tracking-wider rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground cursor-pointer flex items-center gap-2">
              Find perfect match <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="h-14 px-8 text-sm font-black uppercase tracking-wider rounded-2xl bg-card border border-border hover:bg-foreground/5 text-foreground cursor-pointer">
              Go to Arena Dashboard
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 relative z-10"
        >
          <Button
            variant="ghost"
            onClick={() => setShowRoadmap(true)}
            className="h-10 px-6 rounded-full border border-border bg-card hover:bg-foreground/5 font-black uppercase text-[9px] tracking-widest text-muted-foreground flex items-center gap-2 cursor-pointer"
          >
            <Rocket className="w-3.5 h-3.5 text-primary" /> Roadmap & Features
          </Button>
        </motion.div>

        <FeatureRoadmap
          isOpen={showRoadmap}
          onClose={() => setShowRoadmap(false)}
        />
      </section>

      {/* Feature Section Grid */}
      <section className="py-24 border-t border-border bg-card/30">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Users, title: "Smart Skill Alignment", desc: "DevMatch calculates technology overlap, project preferences, and development velocity to structure balanced, high-productivity squads." },
              { icon: Code, title: "Automated Repository Parsing", desc: "Scan any public repository to instantly identify required engineering roles, eliminating manual developer screening." },
              { icon: Shield, title: "Tactical Onboarding Blueprints", desc: "Instantly synthesize technical digests and architectural walkthroughs, optimizing developer onboarding time from weeks to minutes." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border p-8 rounded-[2rem] flex flex-col items-start gap-6 hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm font-medium">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
