"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileForm } from "@/components/profile/profile-form";
import { MatchCard } from "@/components/matches/match-card";
import { calculateMatch, MOCK_USERS, UserProfile } from "@/lib/utils/matching";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function MatchesPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Simulation: When profile is "complete"
    const handleComplete = () => {
        // For demo, we just use a mock profile if they click complete
        setProfile({
            name: "Ayush Rana",
            github: "ayushrana",
            role: "Frontend",
            skills: ["React", "Three.js", "TailwindCSS"],
            style: "Builder"
        });
        setShowResults(true);
    };

    const allMatches = profile
        ? MOCK_USERS.map(u => calculateMatch(profile, u)).sort((a, b) => b.score - a.score)
        : [];

    const filteredMatches = allMatches.filter(match => {
        const q = searchQuery.toLowerCase();
        return (
            match.user.name.toLowerCase().includes(q) ||
            match.user.role.toLowerCase().includes(q) ||
            match.user.skills.some((s: string) => s.toLowerCase().includes(q))
        );
    });

    return (
        <div className="pt-32 pb-64 container mx-auto px-6">
            <AnimatePresence mode="wait">
                {!showResults ? (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">
                                Setup your <span className="text-primary text-glow">Builder Profile</span>
                            </h1>
                            <p className="text-muted-foreground max-w-xl mx-auto">
                                We'll use your GitHub and skills to find the perfect technical match.
                            </p>
                        </div>
                        {/* Integrated Profile Flow */}
                        <div className="relative">
                            <ProfileForm onComplete={handleComplete} />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-12"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            <div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowResults(false)}
                                    className="mb-6 -ml-4 text-muted-foreground hover:text-foreground gap-2 active:scale-95 transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Edit Profile
                                </Button>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                                    Your <span className="text-primary text-glow">Perfect Matches</span>
                                </h1>
                                <p className="text-muted-foreground mt-4">
                                    Based on your tech stack and hackathon work style.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 p-4 glass rounded-2xl border-primary/20">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold">AI Team Builder</div>
                                    <div className="text-xs text-muted-foreground">Optimal balance found</div>
                                </div>
                            </div>
                        </div>

                        {/* Premium Search Bar */}
                        <div className="relative max-w-xl mb-12 group/search">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <Sparkles className="w-4 h-4 text-primary/40 group-focus-within/search:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, role, or tech stack..."
                                className="w-full h-14 pl-14 pr-6 rounded-2xl glass-premium border-foreground/5 focus:border-primary/30 transition-all outline-none text-sm font-medium tracking-tight placeholder:text-stone-400 selection:bg-primary/30"
                            />
                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                                <div className="px-2 py-1 rounded-md bg-foreground/5 border border-foreground/10 text-[9px] uppercase font-black tracking-widest text-stone-500">
                                    {filteredMatches.length} Matches Found
                                </div>
                            </div>
                        </div>

                        {filteredMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredMatches.map((match, i) => (
                                    <MatchCard key={i} match={match} />
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-20 text-center glass-card rounded-[2.5rem] border-foreground/5"
                            >
                                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                                    <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">No Matches Found</h3>
                                <p className="text-muted-foreground">Try searching for a different skill or role.</p>
                                <Button
                                    variant="ghost"
                                    onClick={() => setSearchQuery("")}
                                    className="mt-6 text-primary hover:text-foreground active:scale-95 transition-all"
                                >
                                    Clear Search
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
