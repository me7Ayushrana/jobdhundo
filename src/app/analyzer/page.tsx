"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RepoTree } from "@/components/analyzer/repo-tree";
import { RepoGraph } from "@/components/analyzer/repo-graph";
import { RepoNode, parseGithubUrl, fetchRepoTree, fetchPackageJson, identifyTechStack } from "@/lib/utils/github";
import { Terminal as GithubIcon, Search, BookOpen, Layers, Terminal as TerminalIcon, Sparkles, Code2, Layout, Database, Network, Dna, Zap, ShieldCheck, ArrowRight } from "lucide-react";

export default function AnalyzerPage() {
    const [url, setUrl] = useState("https://github.com/me7Ayushrana/noise-DevMatch");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Dynamic repo details states
    const [tree, setTree] = useState<RepoNode[]>([]);
    const [techStack, setTechStack] = useState<string[]>([]);
    const [entryPoint, setEntryPoint] = useState<string>("src/app/page.tsx");
    const [logicHeavyPercentage, setLogicHeavyPercentage] = useState<number>(50);

    const startAnalysis = async () => {
        setError(null);
        setResults(false);

        const parsed = parseGithubUrl(url);
        if (!parsed) {
            setError("Invalid GitHub URL format. Use: https://github.com/owner/repo");
            return;
        }

        setIsAnalyzing(true);
        try {
            const { owner, repo, branch } = parsed;

            // Fetch recursive tree
            const { tree: fetchedTree, flat, defaultBranch } = await fetchRepoTree(owner, repo, branch || "main");

            // Fetch package.json if present
            const packageJson = await fetchPackageJson(owner, repo, defaultBranch);

            // Identify stack
            const stack = identifyTechStack(flat, packageJson);

            // Find primary entry point dynamically
            let primaryEntry = "src/app/page.tsx";
            const filePaths = flat.map(f => f.path);
            if (filePaths.includes("src/app/page.tsx")) {
                primaryEntry = "src/app/page.tsx";
            } else if (filePaths.includes("src/main.ts")) {
                primaryEntry = "src/main.ts";
            } else if (filePaths.includes("src/index.js")) {
                primaryEntry = "src/index.js";
            } else if (filePaths.includes("index.html")) {
                primaryEntry = "index.html";
            } else if (flat.length > 0) {
                const firstFile = flat.find(f => f.type === "blob");
                if (firstFile) primaryEntry = firstFile.path;
            }

            // Compute logic vs UI components
            let logicCount = 0;
            let uiCount = 0;
            flat.forEach(f => {
                if (f.type === "blob") {
                    const ext = f.path.split(".").pop()?.toLowerCase();
                    if (["ts", "js", "py", "go", "rs", "java", "cpp", "sol", "c", "cs", "rb"].includes(ext || "")) {
                        logicCount++;
                    } else {
                        uiCount++;
                    }
                }
            });
            const total = logicCount + uiCount;
            const logicPct = total > 0 ? Math.round((logicCount / total) * 100) : 50;

            setTree(fetchedTree);
            setTechStack(stack);
            setEntryPoint(primaryEntry);
            setLogicHeavyPercentage(logicPct);
            setResults(true);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to analyze repository. Confirm the repository is public.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="pt-32 pb-20 container mx-auto px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-16 relative z-10">
                <header className="text-center space-y-6">
                    <Badge variant="outline" className="bg-foreground/5 border-foreground/10 text-[10px] font-black tracking-[0.3em] text-primary uppercase py-1.5 px-4 rounded-full shimmer-border overflow-hidden">
                        Intelligence Protocol V2.0
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-foreground">
                        Neural <span className="text-primary text-glow">Repo</span><br />
                        <span className="italic text-stone-400">Architecture</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Deconstructing codebase DNA in real-time. Paste a GitHub URL to start the sequence.
                    </p>
                </header>

                <div className="flex gap-4 p-3 glass-premium rounded-[2.5rem] border-foreground/5 max-w-3xl mx-auto shadow-2xl group transition-all duration-700 hover:border-primary/30">
                    <div className="flex-1 flex items-center px-6 gap-4 bg-foreground/[0.02] rounded-[1.8rem] border border-foreground/5 group-focus-within:border-primary/40 transition-all">
                        <GithubIcon className="w-6 h-6 text-primary/40 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="https://github.com/facebook/react"
                            className="border-none bg-transparent focus-visible:ring-0 text-lg h-16 placeholder:text-stone-400 font-medium text-foreground"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && startAnalysis()}
                        />
                    </div>
                    <Button
                        disabled={!url || isAnalyzing}
                        onClick={startAnalysis}
                        className="h-16 px-12 bg-primary hover:bg-foreground hover:text-background text-xs font-black uppercase tracking-widest rounded-[1.5rem] shadow-glow active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                        {isAnalyzing ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                <Sparkles className="w-5 h-5" />
                            </motion.div>
                        ) : (
                            <motion.div whileHover={{ x: 5 }} className="flex items-center gap-2">
                                Analyze Repository <ArrowRight className="w-4 h-4 ml-2" />
                            </motion.div>
                        )}
                    </Button>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-center max-w-xl mx-auto text-xs font-bold uppercase tracking-wider"
                    >
                        ⚠️ {error}
                    </motion.div>
                )}

                <AnimatePresence>
                    {results && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
                        >
                            {/* File Tree Sidebar */}
                            <div className="lg:col-span-4 space-y-8">
                                <Card className="glass-premium border-foreground/5 rounded-[2.5rem]">
                                    <CardHeader className="px-8 pt-8">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/40">
                                                    <Layers className="w-4 h-4 text-primary" />
                                                </div>
                                                Skeleton View
                                            </CardTitle>
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border">Entry Point Detected</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-8 space-y-6">
                                        <div className="mx-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold border border-emerald-500/40">
                                                <TerminalIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Primary Entry</div>
                                                <div className="text-xs font-bold text-stone-700 truncate max-w-[200px]">{entryPoint}</div>
                                            </div>
                                        </div>
                                        <RepoTree nodes={tree} />
                                    </CardContent>
                                </Card>

                                <Card className="glass-premium border-foreground/5 rounded-[2.5rem]">
                                    <CardHeader className="px-8 pt-8">
                                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40">
                                                <TerminalIcon className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            Tech Stack
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-8 pb-8 flex flex-wrap gap-2">
                                        {techStack.map(t => (
                                            <Badge key={t} variant="secondary" className="bg-foreground/5 border-foreground/10 text-[10px] font-bold uppercase tracking-tighter hover:bg-primary/20 hover:text-primary transition-colors cursor-default text-stone-600">{t}</Badge>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Main Analysis Results */}
                            <div className="lg:col-span-8 space-y-10">
                                {/* Workflow Visualization */}
                                <Card className="glass-premium border-foreground/5 p-10 rounded-[3rem] relative overflow-hidden group">
                                    <CardHeader className="p-0 mb-10">
                                        <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-4 text-foreground">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40 shadow-glow">
                                                <Network className="w-7 h-7 text-indigo-500" />
                                            </div>
                                            Workflow <span className="text-indigo-500 text-glow">Logic</span>
                                        </CardTitle>
                                        <CardDescription className="text-stone-500 font-mono text-xs uppercase tracking-widest pl-16">Data Propagation Mapping</CardDescription>
                                    </CardHeader>

                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-[2rem] bg-foreground/[0.02] border border-foreground/5 relative z-10">
                                        {[
                                            { label: "Frontend", sub: "User Interface", icon: Layout, color: "text-blue-500" },
                                            { label: "Logic Gateway", sub: "Traffic Director", icon: Zap, color: "text-primary" },
                                            { label: "Data System", sub: "Persistence Layer", icon: Database, color: "text-emerald-600" }
                                        ].map((step, i, arr) => (
                                            <div key={step.label} className="flex flex-col md:flex-row items-center gap-6 group/wf">
                                                <div className="flex flex-col items-center gap-3 text-center">
                                                    <div className={`w-16 h-16 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center group-hover/wf:border-primary group-hover/wf:scale-110 transition-all duration-500 ${step.color}`}>
                                                        <step.icon className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black tracking-tighter uppercase text-foreground">{step.label}</div>
                                                        <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{step.sub}</div>
                                                    </div>
                                                </div>
                                                {i < arr.length - 1 && (
                                                    <ArrowRight className="w-6 h-6 text-stone-300 hidden md:block animate-pulse" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Neural DNA Card */}
                                <Card className="glass-premium border-foreground/5 p-10 rounded-[3rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                                        <Dna className="w-24 h-24 text-primary" />
                                    </div>
                                    <CardHeader className="p-0 mb-8">
                                        <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-4 text-foreground">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-glow">
                                                <Zap className="w-7 h-7 text-primary" />
                                            </div>
                                            Neural <span className="text-primary text-glow">DNA</span>
                                        </CardTitle>
                                        <CardDescription className="text-stone-500 font-mono text-xs uppercase tracking-widest pl-16 italic">Heuristic Pattern Recognition</CardDescription>
                                    </CardHeader>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                                    <span className="text-indigo-600 font-bold">Logic: {logicHeavyPercentage}%</span>
                                                    <span className="text-pink-600 font-bold">UI: {100 - logicHeavyPercentage}%</span>
                                                </div>
                                                <div className="h-3 w-full bg-foreground/5 rounded-full overflow-hidden flex border border-foreground/5 p-0.5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${logicHeavyPercentage}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="h-full bg-indigo-500 rounded-l-full"
                                                    />
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${100 - logicHeavyPercentage}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                                        className="h-full bg-pink-500 rounded-r-full"
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-foreground/[0.02] border border-foreground/5 space-y-3">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Architectural Profile</div>
                                                <div className="text-xl font-black tracking-tight text-foreground flex items-center gap-3">
                                                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                                    {logicHeavyPercentage > 60 ? "Robust Logic Engine" : logicHeavyPercentage < 40 ? "Rich Client UI / Designer" : "Balanced Full-Stack Platform"}
                                                </div>
                                                <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                                                    {logicHeavyPercentage > 60 
                                                        ? "Heavy focus on logic flow, data processing, and back-end orchestration. Ideal for high performance backend systems."
                                                        : logicHeavyPercentage < 40 
                                                            ? "Highly visual, user interface focused architecture. Streamlined for micro-interactions, responsive styling, and fast renders."
                                                            : "Balanced distribution of UI components and database/logic controllers. Well suited for general product scalability."
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Team Mapping Recommendations</div>
                                            <div className="space-y-3">
                                                {[
                                                    { role: techStack.includes("Go") || techStack.includes("Python") || techStack.includes("Rust") ? "Backend / DevOps" : "Backend Dev", task: "Lead Core API & Deploy Setup", icon: Database },
                                                    { role: "Frontend Lead", task: "Optimize Component Atomic Structure", icon: Layout },
                                                    { role: "Product Manager", task: "Focus on Workflow Edge Cases", icon: Sparkles }
                                                ].map((rec, i) => (
                                                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all cursor-default group/rec">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/40 group-hover/rec:bg-primary group-hover/rec:text-white transition-all shadow-glow">
                                                            <rec.icon className="w-5 h-5 text-primary group-hover/rec:text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black uppercase text-primary tracking-widest">{rec.role}</div>
                                                            <div className="text-xs font-bold text-stone-700">{rec.task}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="glass-premium border-foreground/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="space-y-2">
                                            <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-4 text-foreground">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-glow">
                                                    <Network className="w-7 h-7 text-primary" />
                                                </div>
                                                Architecture <span className="text-primary text-glow">Graph</span>
                                            </CardTitle>
                                            <CardDescription className="text-stone-500 font-mono text-xs uppercase tracking-widest pl-16">Recursive Structural Mapping</CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 animate-pulse px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Live Data Stream</Badge>
                                    </div>
                                    <div className="rounded-[2rem] overflow-hidden border border-foreground/5 bg-foreground/40 p-4 shadow-inner relative shimmer-border">
                                        <RepoGraph nodes={tree} repoUrl={url || "https://github.com/facebook/react"} />
                                    </div>
                                </Card>

                                <Card className="glass-premium border-foreground/5 p-10 rounded-[3rem] relative overflow-hidden group">
                                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                                    <CardHeader className="p-0 mb-10">
                                        <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-4 text-foreground">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                                <BookOpen className="w-7 h-7 text-emerald-500" />
                                            </div>
                                            Beginner <span className="text-emerald-600 text-glow">Guide</span>
                                        </CardTitle>
                                        <CardDescription className="text-stone-500 font-mono text-xs uppercase tracking-widest pl-16">Synthesized Onboarding Protocol</CardDescription>
                                    </CardHeader>
                                    <div className="space-y-8 relative z-10">
                                        {[
                                            { id: 1, text: `Start by exploring the entry file \`${entryPoint}\` to locate execution origins.`, color: "primary" },
                                            { id: 2, text: techStack.includes("Next.js") 
                                                ? "This repository uses Next.js. Page routing is managed dynamically inside the \`/app\` folder." 
                                                : "Analyze config setups to understand trace boundary rules.", color: "primary" },
                                            { id: 3, text: "Verify library settings in \`tsconfig.json\` or dependency keys inside \`package.json\`.", color: "primary" }
                                        ].map((step) => (
                                            <div key={step.id} className="flex gap-6 group/step">
                                                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center font-black text-foreground border border-foreground/10 group-hover/step:bg-primary group-hover/step:border-primary group-hover/step:text-white group-hover/step:shadow-glow transition-all duration-500 shrink-0">
                                                    {step.id}
                                                </div>
                                                <p className="text-stone-600 leading-relaxed font-semibold group-hover/step:text-stone-900 transition-colors">
                                                    {step.text.split('`').map((part, i) => i % 2 === 1 ? <code key={i} className="text-primary font-black bg-primary/10 px-2 py-0.5 rounded-md mx-1">{part}</code> : part)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

