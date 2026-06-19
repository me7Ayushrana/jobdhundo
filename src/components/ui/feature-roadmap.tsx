"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, GitBranch, Radar, Sparkles, Users, Bot, Layout, Activity, FileText, Check } from "lucide-react";
import { Button } from "./button";

interface FeatureRoadmapProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FeatureRoadmap({ isOpen, onClose }: FeatureRoadmapProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === "Escape") onClose();
            };
            window.addEventListener("keydown", handleEscape);
            return () => {
                document.body.style.overflow = "unset";
                window.removeEventListener("keydown", handleEscape);
            };
        }
    }, [isOpen, onClose]);

    const liveFeatures = [
        {
            icon: Zap,
            title: "Neural DNA Mapping",
            desc: "Instant tech stack identification via GitHub repository scanning.",
            color: "text-yellow-400"
        },
        {
            icon: GitBranch,
            title: "Workflow Architecture",
            desc: "Visual mapping of codebase propagation and entry point detection.",
            color: "text-blue-400"
        },
        {
            icon: Radar,
            title: "Nexus HQ Radar",
            desc: "Comprehensive team health metrics and skill gap analysis.",
            color: "text-emerald-400"
        },
        {
            icon: Sparkles,
            title: "Premium UI/UX",
            desc: "State-of-the-art glassmorphism with tactile motion feedback.",
            color: "text-primary"
        },
        {
            icon: Users,
            title: "Smart Matchmaking",
            desc: "AI-driven squad formation based on role-specific heuristics.",
            color: "text-purple-400"
        }
    ];

    const roadmapItems = [
        {
            icon: Bot,
            title: "Skill Gap Agent",
            desc: "AI that auto-recruits missing squad roles from our talent pool.",
            status: "PLANNED"
        },
        {
            icon: Layout,
            title: "War Room Dashboard",
            desc: "Real-time collaborative workspace for formed hackathon squads.",
            status: "IN PROGRESS"
        },
        {
            icon: Activity,
            title: "Commit-Pulse 3D",
            desc: "3D visualization of team velocity and repository growth pulse.",
            status: "PLANNED"
        },
        {
            icon: FileText,
            title: "Pitch Deck AI",
            desc: "Automated generation of technical pitch decks based on repo data.",
            status: "PLANNED"
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl max-h-[90vh] glass-premium rounded-[2.5rem] border-foreground/10 shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="p-6 sm:p-8 border-b border-foreground/5 flex items-center justify-between bg-foreground/[0.02]">
                            <div className="flex items-center gap-3">
                                
                                <h2 className="text-2xl font-black tracking-tighter">Features & Roadmap</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="w-10 h-10 rounded-full hover:bg-foreground/10 transition-all active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-10">
                            {/* Live Now Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400/80">Live Now (Premium)</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {liveFeatures.map((f, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-5 rounded-3xl bg-foreground/[0.03] border border-foreground/5 hover:border-foreground/10 transition-all group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-xl bg-foreground/[0.05] flex items-center justify-center border border-foreground/5 group-hover:scale-110 transition-transform ${f.color}`}>
                                                    <f.icon className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-sm text-foreground/90">{f.title}</h4>
                                                    <p className="text-xs text-stone-500 leading-relaxed">{f.desc}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>

                            {/* Bottom Close Button for redundency */}
                            <div className="pt-4 flex justify-center sm:hidden">
                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    className="w-full rounded-2xl glass hover:bg-foreground/5"
                                >
                                    Close
                                </Button>
                            </div>

                            {/* Roadmap Section */}
                            <section className="space-y-6 pb-4">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Upcoming Roadmap</h3>
                                </div>

                                <div className="space-y-3">
                                    {roadmapItems.map((r, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 + i * 0.1 }}
                                            className="p-5 rounded-2xl bg-black/40 border border-foreground/5 flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-primary/50 group-hover:text-primary transition-colors">
                                                    <r.icon className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-sm text-stone-700">{r.title}</h4>
                                                    <p className="text-[10px] text-stone-500 leading-tight">{r.desc}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${r.status === "IN PROGRESS"
                                                ? "bg-primary/20 text-primary border border-primary/20"
                                                : "bg-foreground/5 text-stone-500 border border-foreground/5"
                                                }`}>
                                                {r.status}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
