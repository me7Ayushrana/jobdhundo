"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    Calendar,
    Users,
    Plus,
    CheckCircle2,
    XCircle,
    LayoutGrid,
    ShieldCheck,
    Send,
    Sparkles,
    ArrowRight,
    Zap,
    ExternalLink,
    Search,
    Clock,
    Target,
    RefreshCw,
    Wifi,
    WifiOff,
    Database,
    Flame,
    Shield,
    MapPin,
    Briefcase,
    DollarSign,
    SlidersHorizontal,
    Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──────────────────────────────────────────────────────────
interface ArenaHackathon {
    id: string;
    title: string;
    organizer: string;
    daysLeft: number | null;
    participants: number;
    imageUrl: string;
    unstopUrl: string;
    tags: string[];
    prize?: string;
    stipend?: string;
    salary?: string;
    opportunityType: "hackathon" | "internship" | "job";
    teamFitScore: number;
    suggestedRoles: string[];
    location: string;
}

interface LocalHackathon {
    id: string;
    title: string;
    date: string;
    prize: string;
    participants: number;
    status: 'approved' | 'pending';
    category: string;
    image?: string;
}

type DataSource = "live" | "cache" | "fallback";

interface UserPreferences {
    preferredRoles: string[];
    skills: string[];
    location: string;
}

const PRESET_ROLES = [
    "Frontend Dev",
    "Backend Dev",
    "Full-Stack Dev",
    "ML Engineer",
    "Data Scientist",
    "Smart Contract Dev",
    "Web3 Engineer",
    "DevOps Engineer",
    "UI/UX Designer",
    "Mobile Dev",
];

const PRESET_SKILLS = [
    "React",
    "Next.js",
    "TypeScript",
    "Python",
    "Solidity",
    "Node.js",
    "AWS",
    "Figma",
    "Docker",
    "GraphQL",
];

const PRESET_LOCATIONS = [
    "Remote",
    "Bengaluru",
    "Delhi NCR",
    "Mumbai",
    "Pune",
    "Hyderabad",
    "Chennai",
    "Any"
];

// Helper to compute fit score dynamically based on user preferences
function computeOpportunityFit(opp: ArenaHackathon, prefs: UserPreferences): number {
    let score = 35;
    
    // 1. Location match
    const oppLoc = (opp.location || "").toLowerCase();
    const prefLoc = (prefs.location || "").toLowerCase();
    if (prefLoc === "remote" && oppLoc === "remote") {
        score += 25;
    } else if (oppLoc.includes(prefLoc) || prefLoc.includes(oppLoc)) {
        score += 25;
    } else if (oppLoc === "remote" || prefLoc === "any") {
        score += 15;
    }
    
    // 2. Roles match
    let roleMatches = 0;
    for (const role of opp.suggestedRoles || []) {
        if (prefs.preferredRoles.some(r => r.toLowerCase() === role.toLowerCase())) {
            roleMatches++;
        }
    }
    score += Math.min(roleMatches * 15, 30);
    
    // 3. Skills/Tags match
    let skillMatches = 0;
    const oppText = `${opp.title} ${opp.tags.join(" ")}`.toLowerCase();
    for (const skill of prefs.skills) {
        if (oppText.includes(skill.toLowerCase())) {
            skillMatches++;
        }
    }
    score += Math.min(skillMatches * 10, 30);
    
    // Jitter based on ID to remain deterministic per opportunity
    const hash = opp.title.charCodeAt(0) + (opp.title.charCodeAt(opp.title.length - 1) || 0);
    const jitter = hash % 5;
    
    return Math.min(score + jitter, 99);
}

// ── Skeleton Card ──────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="glass-premium rounded-[2.5rem] overflow-hidden animate-pulse">
            <div className="h-52 m-2 rounded-[2rem] bg-foreground/[0.04]" />
            <div className="px-8 py-6 space-y-4">
                <div className="h-6 bg-foreground/[0.06] rounded-xl w-3/4" />
                <div className="h-4 bg-foreground/[0.04] rounded-lg w-1/2" />
                <div className="flex gap-2 mt-4">
                    <div className="h-6 bg-foreground/[0.04] rounded-full w-16" />
                    <div className="h-6 bg-foreground/[0.04] rounded-full w-20" />
                </div>
                <div className="h-px bg-foreground/5 my-4" />
                <div className="flex justify-between items-center">
                    <div className="h-8 bg-foreground/[0.04] rounded-lg w-24" />
                    <div className="h-10 bg-foreground/[0.04] rounded-xl w-28" />
                </div>
                <div className="h-14 bg-foreground/[0.06] rounded-2xl w-full mt-4" />
            </div>
        </div>
    );
}

// ── Match Fit Badge ─────────────────────────────────────────────────
function TeamFitBadge({ score }: { score: number }) {
    const color =
        score >= 75
            ? "from-emerald-500/20 to-emerald-500/5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            : score >= 50
                ? "from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-600 dark:text-amber-400"
                : "from-red-500/20 to-red-500/5 border-red-500/40 text-red-600 dark:text-red-400";

    const glowColor =
        score >= 75
            ? "rgba(16,185,129,0.2)"
            : score >= 50
                ? "rgba(245,158,11,0.2)"
                : "rgba(239,68,68,0.2)";

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${color} border text-xs font-black tracking-wider`}
            style={{ boxShadow: `0 0 12px ${glowColor}` }}
        >
            <Target className="w-3.5 h-3.5" />
            {score}% MATCH
        </div>
    );
}

// ── Days Left Pill ─────────────────────────────────────────────────
function DaysLeftPill({ days }: { days: number | null }) {
    if (days === null) return <span className="text-foreground/30 text-xs italic">Open Application</span>;

    const urgent = days <= 3;
    const soon = days <= 7;

    return (
        <span
            className={`flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider ${
                urgent
                    ? "text-red-500 dark:text-red-400"
                    : soon
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-foreground/50"
            }`}
        >
            {urgent ? <Flame className="w-3.5 h-3.5 animate-pulse" /> : <Clock className="w-3.5 h-3.5" />}
            {days === 0 ? "ENDS TODAY" : days === 1 ? "1 DAY LEFT" : `${days} DAYS LEFT`}
        </span>
    );
}

// ── Source Indicator ───────────────────────────────────────────────
function SourceIndicator({ source }: { source: DataSource }) {
    const config = {
        live: { icon: Wifi, label: "LIVE", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        cache: { icon: Database, label: "CACHED", color: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
        fallback: { icon: WifiOff, label: "OFFLINE", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
    };
    const { icon: Icon, label, color } = config[source];
    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-[0.2em] ${color}`}>
            <Icon className="w-3 h-3" />
            {label}
        </div>
    );
}

// ── Opportunity Card with Spotify/Clutch Expanding Hover Effect ─────
function OpportunityCard({ hack, preferences, index }: { hack: ArenaHackathon; preferences: UserPreferences; index: number }) {
    const [isHovered, setIsHovered] = useState(false);
    const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
            setIsHovered(true);
        }, 900);
    };

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setIsHovered(false);
    };

    useEffect(() => {
        return () => {
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        };
    }, []);

    const isLeft = index % 3 === 0;
    const isRight = index % 3 === 2;

    const hoverPositionClass = isLeft
        ? "md:left-0"
        : isRight
            ? "md:right-0"
            : "md:left-1/2 md:-translate-x-1/2";

    return (
        <div
            className="w-full max-w-sm h-[400px] relative shrink-0"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                layout
                transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 24,
                }}
                className={`flex flex-col cursor-pointer transition-[background-color,border-color] duration-300 border rounded-[2.5rem] ${
                    isHovered
                        ? `md:flex-row md:items-stretch w-full md:w-[580px] bg-card border-primary/40 dark:border-primary/50 shadow-2xl md:absolute md:top-0 md:z-50 md:min-h-full ${hoverPositionClass}`
                        : "w-full h-full relative bg-card/60 border-foreground/5 dark:border-white/5 hover:bg-card hover:border-foreground/10"
                }`}
            >
            {/* Hover Background Glow */}
            {isHovered && (
                <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-xl -z-10" />
            )}

            {/* Image Container - Aspect ratio is locked to 1:1 square in both states to prevent stretching */}
            <motion.div
                layout
                className={`relative overflow-hidden shrink-0 shadow-md aspect-square ${
                    isHovered
                        ? "w-full md:w-44 md:h-44 rounded-[1.8rem] m-3 mb-0 md:mb-3"
                        : "w-full rounded-2xl p-0.5"
                }`}
            >
                <div className="w-full h-full relative rounded-2xl overflow-hidden">
                    {hack.imageUrl ? (
                        <img
                            src={hack.imageUrl}
                            alt={hack.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-indigo-900/40 flex items-center justify-center">
                            <Trophy className="w-10 h-10 text-primary/40" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-40" />
                </div>

                {/* Match Score Badge (Visible on top right of the square image) */}
                <div className="absolute top-2 right-2 scale-90 origin-top-right z-20">
                    <TeamFitBadge score={hack.teamFitScore} />
                </div>
            </motion.div>

            {/* Content Wrapper */}
            <motion.div
                layout
                className={`flex flex-col justify-between flex-1 p-5 ${
                    isHovered
                        ? "md:pl-4 min-w-0"
                        : "w-full pt-1 pb-3 px-1"
                }`}
            >
                {isHovered ? (
                    <div className="flex flex-col justify-between h-full space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5">
                                    {hack.opportunityType}
                                </Badge>
                                <DaysLeftPill days={hack.daysLeft} />
                            </div>
                            
                            <h3 className="text-lg font-black tracking-tight text-foreground leading-snug line-clamp-2">
                                {hack.title}
                            </h3>
                            
                            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                                <Shield className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                                <span className="truncate">{hack.organizer}</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span>{hack.location}</span>
                            </div>
                        </div>

                        {/* Middle detailed metadata (Tags, Roles, Match Rationale) */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-1.5">
                                {hack.tags.slice(0, 3).map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="outline"
                                        className="bg-foreground/[0.02] border-foreground/10 text-[9px] text-muted-foreground font-mono"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            
                            {/* Match explanation */}
                            {hack.teamFitScore >= 50 && (
                                <div className="text-[10px] text-muted-foreground bg-primary/5 rounded-xl p-2 border border-primary/10 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="line-clamp-1">
                                        Matched: {[
                                            (hack.location || "").toLowerCase() === preferences.location.toLowerCase() ? "Location" : null,
                                            hack.suggestedRoles.some(r => preferences.preferredRoles.includes(r)) ? "Role" : null,
                                            preferences.skills.some(s => `${hack.title} ${hack.tags.join(" ")}`.toLowerCase().includes(s.toLowerCase())) ? "Skill" : null
                                        ].filter(Boolean).join(", ") || "Stack"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Remuneration Row & CTA Button */}
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center text-xs border-t border-foreground/5 pt-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        {hack.opportunityType === "hackathon" ? (
                                            <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        ) : hack.opportunityType === "internship" ? (
                                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        ) : (
                                            <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        )}
                                    </div>
                                    <span className="font-extrabold text-foreground">
                                        {hack.opportunityType === "hackathon" ? hack.prize : hack.opportunityType === "internship" ? hack.stipend : hack.salary}
                                    </span>
                                </div>
                                
                                <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                                    <Users className="w-3 h-3 text-primary" />
                                    {hack.participants.toLocaleString()}
                                </span>
                            </div>

                            <a
                                href={hack.unstopUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-11 rounded-xl bg-foreground hover:bg-foreground/90 text-background dark:bg-white dark:hover:bg-white/90 dark:text-black font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 group/btn cursor-pointer"
                            >
                                Apply on Unstop
                                <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between items-center">
                            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0">
                                {hack.opportunityType}
                            </Badge>
                            <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-0.5 truncate max-w-[100px]">
                                <MapPin className="w-2.5 h-2.5 shrink-0 text-primary/60" />
                                <span className="truncate">{hack.location}</span>
                            </span>
                        </div>
                        <h4 className="text-sm font-black text-foreground line-clamp-2 leading-tight min-h-[40px]">
                            {hack.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-semibold truncate">
                            {hack.organizer}
                        </p>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-foreground/5">
                            <span className="text-[11px] font-extrabold text-primary">
                                {hack.opportunityType === "hackathon" 
                                    ? hack.prize 
                                    : hack.opportunityType === "internship" 
                                        ? (hack.stipend?.split("/")[0] || hack.stipend)
                                        : (hack.salary?.split("/")[0] || hack.salary)}
                            </span>
                            <span className="text-[9px] text-muted-foreground/60 font-mono">
                                {hack.daysLeft !== null ? `${hack.daysLeft}d left` : "Open"}
                            </span>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    </div>
);
}

// ── Main Page Component ────────────────────────────────────────────
export default function DashboardPage() {
    // Active tabs: explorer, submit, admin
    const [activeTab, setActiveTab] = useState("explorer");
    const [selectedCategory, setSelectedCategory] = useState<"all" | "hackathon" | "internship" | "job">("all");

    // Fetch and loading states
    const [arenaData, setArenaData] = useState<ArenaHackathon[]>([]);
    const [dataSource, setDataSource] = useState<DataSource>("fallback");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Preferences panel toggle and values
    const [showPrefs, setShowPrefs] = useState(false);
    const [preferences, setPreferences] = useState<UserPreferences>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("devmatch_preferences");
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {}
            }
        }
        return {
            preferredRoles: ["Frontend Dev", "Full-Stack Dev"],
            skills: ["React", "TypeScript", "Next.js"],
            location: "Remote",
        };
    });

    // Local proposals management
    const [localHackathons, setLocalHackathons] = useState<LocalHackathon[]>([]);
    const [newHackathon, setNewHackathon] = useState({ title: "", date: "", prize: "", category: "", image: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Save preferences to localstorage
    useEffect(() => {
        localStorage.setItem("devmatch_preferences", JSON.stringify(preferences));
    }, [preferences]);

    // Fetch arena data
    const fetchArena = async (category = selectedCategory) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/arena?type=${category}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setArenaData(json.hackathons || []);
            setDataSource(json.source || "fallback");
        } catch (err) {
            console.error("[Arena] Fetch failed:", err);
            setError("Failed to load live data. Displaying local offline opportunities.");
            setDataSource("fallback");
        } finally {
            setIsLoading(false);
        }
    };

    // Refetch on category changes
    useEffect(() => {
        fetchArena(selectedCategory);
    }, [selectedCategory]);

    // Compute compatibility scores on the fly and filter/sort opportunities
    const processedOpportunities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        
        let filtered = arenaData;
        if (query) {
            filtered = arenaData.filter(
                (opp) =>
                    opp.title.toLowerCase().includes(query) ||
                    opp.organizer.toLowerCase().includes(query) ||
                    opp.tags.some((t) => t.toLowerCase().includes(query)) ||
                    opp.suggestedRoles.some((r) => r.toLowerCase().includes(query))
            );
        }

        return filtered
            .map((opp) => ({
                ...opp,
                teamFitScore: computeOpportunityFit(opp, preferences),
            }))
            .sort((a, b) => b.teamFitScore - a.teamFitScore);
    }, [arenaData, searchQuery, preferences]);

    const pendingCount = localHackathons.filter((h) => h.status === "pending").length;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            const submission: LocalHackathon = {
                id: Math.random().toString(36).substring(2, 11),
                ...newHackathon,
                participants: 0,
                status: "pending",
            };
            setLocalHackathons([submission, ...localHackathons]);
            setNewHackathon({ title: "", date: "", prize: "", category: "", image: "" });
            setIsSubmitting(false);
            setActiveTab("explorer");
        }, 1500);
    };

    const handleApprove = (id: string) => {
        setLocalHackathons((prev) => prev.map((h) => (h.id === id ? { ...h, status: "approved" as const } : h)));
    };

    const handleReject = (id: string) => {
        setLocalHackathons((prev) => prev.filter((h) => h.id !== id));
    };

    return (
        <div className="pt-32 pb-20 container mx-auto px-6 max-w-7xl relative overflow-hidden text-foreground">
            {/* Ambient Background Glows */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
                <div className="space-y-4">
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-xs font-mono tracking-widest text-primary overflow-hidden relative">
                        <span className="relative z-10 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> ARENA INTEL
                        </span>
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                        Nexus <span className="text-foreground/30 italic">Dev</span><br />
                        <span className="text-primary text-glow">Arena</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                        Live match opportunities. Explore hackathons, internships, and jobs tailored directly for you.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="glass p-1.5 rounded-[2rem] border border-black/5 dark:border-white/5 backdrop-blur-3xl shadow-2xl">
                    <TabsList className="bg-transparent gap-2 h-14">
                        <TabsTrigger value="explorer" className="rounded-2xl px-8 gap-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-500 font-bold">
                            <LayoutGrid className="w-5 h-5" /> Explorer
                        </TabsTrigger>
                        <TabsTrigger value="submit" className="rounded-2xl px-8 gap-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-500 font-bold">
                            <Plus className="w-5 h-5" /> Propose
                        </TabsTrigger>
                        <TabsTrigger value="admin" className="rounded-2xl px-8 gap-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-500 font-bold relative">
                            <ShieldCheck className="w-5 h-5" /> Admin
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs flex items-center justify-center rounded-full font-black shadow-lg">
                                    {pendingCount}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* ── Tab Content ────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ type: "spring", damping: 30, stiffness: 200 }}
                >
                    {/* ── EXPLORER TAB ────────────────────────────── */}
                    {activeTab === "explorer" && (
                        <div className="space-y-8">
                            
                            {/* Category Filter Tabs + Search Controls */}
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
                                <Tabs 
                                    value={selectedCategory} 
                                    onValueChange={(v) => setSelectedCategory(v as any)} 
                                    className="bg-foreground/5 p-1 rounded-2xl border border-foreground/10 max-w-xl shadow-inner w-full lg:w-auto"
                                >
                                    <TabsList className="bg-transparent gap-1 h-11 flex w-full">
                                        <TabsTrigger value="all" className="flex-1 rounded-xl px-5 py-2 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">All</TabsTrigger>
                                        <TabsTrigger value="hackathon" className="flex-1 rounded-xl px-5 py-2 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Hackathons</TabsTrigger>
                                        <TabsTrigger value="internship" className="flex-1 rounded-xl px-5 py-2 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Internships</TabsTrigger>
                                        <TabsTrigger value="job" className="flex-1 rounded-xl px-5 py-2 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Jobs</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                <div className="flex items-center gap-3">
                                    <SourceIndicator source={dataSource} />
                                    
                                    <Button
                                        onClick={() => fetchArena(selectedCategory)}
                                        variant="outline"
                                        className="h-11 w-11 rounded-xl bg-card hover:bg-foreground/5 border border-foreground/10 transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
                                    </Button>

                                    <Button
                                        onClick={() => setShowPrefs(!showPrefs)}
                                        className={`h-11 px-5 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                            showPrefs
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-card hover:bg-foreground/5 border-foreground/10 text-foreground"
                                        }`}
                                    >
                                        <SlidersHorizontal className="w-4 h-4" /> Preferences Settings
                                    </Button>
                                </div>
                            </div>

                            {/* Preference Wizard Expandable Panel */}
                            <AnimatePresence>
                                {showPrefs && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <Card className="glass-premium border-primary/20 p-8 rounded-[2.5rem] space-y-6 relative">
                                            <div className="absolute top-4 right-4">
                                                <button
                                                    onClick={() => setShowPrefs(false)}
                                                    className="w-8 h-8 rounded-full hover:bg-foreground/5 flex items-center justify-center text-muted-foreground transition-all cursor-pointer"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                                                    <SlidersHorizontal className="w-5 h-5 text-primary" /> Personalized Match Settings
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Nexus dynamically scores and matches opportunities based on these skills and roles.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                {/* Preferred Roles */}
                                                <div className="space-y-3">
                                                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary">Ideal Roles</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {PRESET_ROLES.map((role) => {
                                                            const selected = preferences.preferredRoles.includes(role);
                                                            return (
                                                                <button
                                                                    key={role}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const roles = selected
                                                                            ? preferences.preferredRoles.filter(r => r !== role)
                                                                            : [...preferences.preferredRoles, role];
                                                                        setPreferences({ ...preferences, preferredRoles: roles });
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                                                                        selected
                                                                            ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.25)] scale-105"
                                                                            : "bg-foreground/5 text-foreground/60 border border-foreground/10 hover:bg-foreground/10"
                                                                    }`}
                                                                >
                                                                    {role}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Tech Stack Skills */}
                                                <div className="space-y-3">
                                                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary">Core Skills</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {PRESET_SKILLS.map((skill) => {
                                                            const selected = preferences.skills.includes(skill);
                                                            return (
                                                                <button
                                                                    key={skill}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const skills = selected
                                                                            ? preferences.skills.filter(s => s !== skill)
                                                                            : [...preferences.skills, skill];
                                                                        setPreferences({ ...preferences, skills });
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                                                                        selected
                                                                            ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.25)] scale-105"
                                                                            : "bg-foreground/5 text-foreground/60 border border-foreground/10 hover:bg-foreground/10"
                                                                    }`}
                                                                >
                                                                    {skill}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Target Location */}
                                                <div className="space-y-3">
                                                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary">Location Preference</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {PRESET_LOCATIONS.map((loc) => {
                                                            const selected = preferences.location === loc;
                                                            return (
                                                                <button
                                                                    key={loc}
                                                                    type="button"
                                                                    onClick={() => setPreferences({ ...preferences, location: loc })}
                                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                                                                        selected
                                                                            ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.25)] scale-105"
                                                                            : "bg-foreground/5 text-foreground/60 border border-foreground/10 hover:bg-foreground/10"
                                                                    }`}
                                                                >
                                                                    {loc}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Search Bar */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative w-full z-10"
                            >
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    placeholder="Search by keywords, organizer, tags, location or role..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-14 pl-14 pr-6 bg-card border border-foreground/10 rounded-2xl text-base focus:border-primary/50 transition-all outline-none"
                                />
                            </motion.div>

                            {/* Error State */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="glass-premium p-6 rounded-2xl border-amber-500/20 flex items-center gap-4"
                                >
                                    <WifiOff className="w-6 h-6 text-amber-500 shrink-0" />
                                    <p className="text-amber-500/80 text-sm font-medium">{error}</p>
                                </motion.div>
                            )}

                            {/* Loading State */}
                            {isLoading && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <SkeletonCard key={i} />
                                    ))}
                                </div>
                            )}

                            {/* Opportunities Cards Feed */}
                            {!isLoading && processedOpportunities.length > 0 && (
                                <motion.div
                                    layout
                                    className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center w-full relative z-10"
                                >
                                    {processedOpportunities.map((hack, index) => (
                                        <OpportunityCard
                                            key={hack.id}
                                            hack={hack}
                                            index={index}
                                            preferences={preferences}
                                        />
                                    ))}
                                </motion.div>
                            )}

                            {/* Empty feed state */}
                            {!isLoading && processedOpportunities.length === 0 && (
                                <div className="h-60 flex flex-col items-center justify-center opacity-30 space-y-4">
                                    <Search className="w-12 h-12" />
                                    <p className="font-black uppercase tracking-widest text-sm text-center">No opportunities match search context</p>
                                    <Button variant="ghost" onClick={() => setSearchQuery("")} className="text-primary text-xs cursor-pointer">
                                        Clear Search Query
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PROPOSE TAB ─────────────────────────────── */}
                    {activeTab === "submit" && (
                        <div className="max-w-3xl mx-auto pb-20">
                            <Card className="glass-premium border-black/5 dark:border-white/10 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] group-hover:bg-primary/30 transition-colors" />
                                <CardHeader className="p-0 mb-10 space-y-6">
                                    <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-glow animate-pulse-slow">
                                        <Plus className="w-10 h-10 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-4xl font-black tracking-tighter">
                                            Propose a <span className="text-primary text-glow">Hackathon</span>
                                        </CardTitle>
                                        <CardDescription className="text-lg text-muted-foreground">Submit a hackathon setup to Nexus nodes.</CardDescription>
                                    </div>
                                </CardHeader>
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-[0.2em] text-primary ml-1">Event Title</label>
                                            <Input
                                                placeholder="Nexus Dev Summit"
                                                className="h-16 bg-card border border-foreground/10 rounded-2xl px-6 text-lg focus:border-primary/50 transition-all outline-none"
                                                value={newHackathon.title}
                                                onChange={(e) => setNewHackathon({ ...newHackathon, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-[0.2em] text-primary ml-1">Category</label>
                                            <Input
                                                placeholder="Open Source"
                                                className="h-16 bg-card border border-foreground/10 rounded-2xl px-6 text-lg focus:border-primary/50 transition-all outline-none"
                                                value={newHackathon.category}
                                                onChange={(e) => setNewHackathon({ ...newHackathon, category: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-[0.2em] text-primary ml-1">Timeline</label>
                                            <Input
                                                placeholder="July 20-22"
                                                className="h-16 bg-card border border-foreground/10 rounded-2xl px-6 text-lg focus:border-primary/50 transition-all outline-none"
                                                value={newHackathon.date}
                                                onChange={(e) => setNewHackathon({ ...newHackathon, date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-[0.2em] text-primary ml-1">Prize Pool</label>
                                            <Input
                                                placeholder="$10,000"
                                                className="h-16 bg-card border border-foreground/10 rounded-2xl px-6 text-lg focus:border-primary/50 transition-all outline-none"
                                                value={newHackathon.prize}
                                                onChange={(e) => setNewHackathon({ ...newHackathon, prize: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-primary ml-1">Poster Image URL</label>
                                        <Input
                                            placeholder="https://images.unsplash.com/..."
                                            className="h-16 bg-card border border-foreground/10 rounded-2xl px-6 text-lg focus:border-primary/50 transition-all outline-none"
                                            value={newHackathon.image}
                                            onChange={(e) => setNewHackathon({ ...newHackathon, image: e.target.value })}
                                        />
                                        <p className="text-[10px] text-muted-foreground opacity-60 italic mt-2 ml-1 items-center flex gap-2">
                                            <Sparkles className="w-3 h-3 text-primary" /> Protip: High-resolution posters get 2x more dev signups.
                                        </p>
                                    </div>
                                    <Button
                                        disabled={isSubmitting}
                                        className="w-full h-20 bg-primary hover:bg-foreground hover:text-background text-primary-foreground text-xl font-black rounded-3xl gap-4 shadow-2xl active:scale-[0.98] transition-all duration-500 group/submit cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                                <Sparkles className="w-6 h-6" />
                                            </motion.div>
                                        ) : (
                                            <Send className="w-6 h-6 group-hover/submit:translate-x-2 group-hover/submit:-translate-y-2 transition-transform" />
                                        )}
                                        {isSubmitting ? "BROADCASTING TO NETWORK..." : "SUBMIT PROPOSAL"}
                                    </Button>
                                </form>
                            </Card>
                        </div>
                    )}

                    {/* ── ADMIN TAB ───────────────────────────────── */}
                    {activeTab === "admin" && (
                        <div className="space-y-12 max-w-5xl mx-auto pb-20">
                            <div className="flex items-center gap-6 p-8 glass-premium border-primary/20">
                                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-glow">
                                    <ShieldCheck className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight">
                                        Security & <span className="text-primary text-glow">Governance</span>
                                    </h2>
                                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-1">
                                        Reviewing {pendingCount} pending requests
                                    </p>
                                </div>
                            </div>

                            {pendingCount === 0 ? (
                                <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-foreground/10 rounded-[3rem] opacity-30 space-y-6">
                                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                                    <p className="text-xl font-black uppercase tracking-widest">Protocol Synchronized</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {localHackathons
                                        .filter((h) => h.status === "pending")
                                        .map((node) => (
                                            <motion.div
                                                layout
                                                key={node.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="glass-premium p-8 rounded-[2.5rem] border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 group hover:border-primary/40 transition-all duration-500"
                                            >
                                                <div className="flex items-center gap-8 w-full md:w-auto">
                                                    <div className="w-32 h-20 rounded-2xl overflow-hidden border border-foreground/10 shrink-0 shadow-2xl relative group-hover:scale-105 transition-transform duration-500">
                                                        {node.image ? (
                                                            <img src={node.image} alt={node.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
                                                                <Trophy className="w-8 h-8 text-primary/40" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-40" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-2xl font-black tracking-tight leading-none">{node.title}</h3>
                                                        <div className="flex flex-wrap gap-6 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                                                            <span className="flex items-center gap-2">
                                                                <Calendar className="w-3.5 h-3.5 text-primary" /> {node.date}
                                                            </span>
                                                            <span className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                                <Trophy className="w-3.5 h-3.5" /> {node.prize}
                                                            </span>
                                                            <Badge variant="outline" className="bg-foreground/5 border-foreground/10 text-[9px] text-muted-foreground">
                                                                {node.category}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 w-full md:w-auto">
                                                    <Button
                                                        onClick={() => handleReject(node.id)}
                                                        variant="ghost"
                                                        className="h-16 px-8 rounded-2xl hover:bg-destructive/10 hover:text-destructive gap-2 flex-1 md:flex-none border border-foreground/10 hover:border-destructive/20 font-black uppercase text-xs tracking-widest transition-all active:scale-95 cursor-pointer text-foreground"
                                                    >
                                                        <XCircle className="w-5 h-5" /> REJECT
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleApprove(node.id)}
                                                        className="h-16 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black flex items-center justify-center gap-3 flex-1 md:flex-none shadow-lg active:scale-95 transition-all uppercase text-xs tracking-widest cursor-pointer"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" /> APPROVE REQUEST
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
