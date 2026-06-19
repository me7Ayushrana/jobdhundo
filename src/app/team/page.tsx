"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Zap, Trophy, ShieldCheck, AlertCircle, UserPlus, X, MessageSquare, Activity, Brain, Rocket, LayoutDashboard, Plus, Check, XCircle, Send, Terminal as GithubIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { useSocial } from "@/components/providers/social-context";
import { ActivityFeed } from "@/components/social/activity-feed";

interface TeamMember {
    id: string;
    name: string;
    role: string;
    style: string;
    skills: string[];
    avatar: string;
    commits: number;
}

const MOCK_TEAM: TeamMember[] = [
    { id: "1", name: "Ayush Rana", role: "Frontend", style: "Builder", skills: ["React", "Three.js"], avatar: "A", commits: 584 },
    { id: "2", name: "Lokesh Verma", role: "Backend", style: "Thinker", skills: ["Node.js", "PostgreSQL"], avatar: "L", commits: 426 },
    { id: "3", name: "Gurnoor Kaur", role: "Designer", style: "Designer", skills: ["Figma", "Tailwind"], avatar: "G", commits: 270 },
];

const HEALTH_DATA = [
    { subject: "Velocity", A: 85, B: 100 },
    { subject: "Diversity", A: 90, B: 100 },
    { subject: "Logic", A: 80, B: 100 },
    { subject: "UX", A: 95, B: 100 },
    { subject: "DevOps", A: 40, B: 100 },
];

const SKILL_GAPS = [
    { skill: "DevOps Architecture", intensity: "Critical", icon: ShieldCheck, color: "text-orange-700", bg: "bg-orange-50 border border-orange-200" },
    { skill: "AI/ML Integration", intensity: "Warning", icon: Brain, color: "text-primary", bg: "bg-primary/5 border border-primary/20" }
];

export default function TeamPage() {
    const [team, setTeam] = useState(MOCK_TEAM);
    const { pendingTeamInvites, acceptTeamInvite, rejectTeamInvite, toggleFriendsPanel, toggleChat } = useSocial();

    const removeMember = (id: string) => {
        setTeam(team.filter(m => m.id !== id));
    };

    const handleAcceptInvite = (inviteId: string, inviteFrom: { name: string; role: string; skills: string[]; style: string; avatar?: string }) => {
        acceptTeamInvite(inviteId);
        setTeam(prev => [...prev, {
            id: `invited-${Date.now()}`,
            name: inviteFrom.name,
            role: inviteFrom.role,
            style: inviteFrom.style,
            skills: inviteFrom.skills.slice(0, 2),
            avatar: inviteFrom.avatar || inviteFrom.name[0],
            commits: 0,
        }]);
    };

    return (
        <div className="pt-32 pb-20 container mx-auto px-6 max-w-7xl relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <header className="mb-12 space-y-4">
                <Badge variant="outline" className="bg-foreground/5 border-foreground/10 text-[10px] font-black tracking-widest text-primary py-1 px-4 rounded-full">
                    SQUAD OPERATIONS HQ
                </Badge>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                    Nexus <span className="text-primary text-glow text-6xl">HQ</span>
                </h1>
                <div className="flex items-center gap-2 text-stone-400 font-mono text-[10px] uppercase tracking-widest px-1">
                    <GithubIcon className="w-3 h-3 text-primary" />
                    me7Ayushrana/noise-DevMatch
                </div>
                <p className="text-lg text-stone-500 max-w-2xl font-medium italic">Orchestrating technical excellence for the upcoming build.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Team Roster */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Pending Team Invites */}
                    {pendingTeamInvites.length > 0 && (
                        <Card className="bg-white border border-stone-200/80 shadow-2xl p-6 rounded-[2.5rem] relative overflow-hidden">
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Pending Invites ({pendingTeamInvites.length})
                            </h3>
                            <div className="space-y-3">
                                {pendingTeamInvites.map((invite) => (
                                    <motion.div
                                        key={invite.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-stone-50/50 border border-stone-200/60 hover:border-primary/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10 flex items-center justify-center text-lg font-black border border-stone-200 text-primary group-hover:border-primary/40 transition-all">
                                                {invite.from.avatar}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm text-stone-800">{invite.from.name}</h4>
                                                <p className="text-[10px] text-stone-500 font-mono uppercase">{invite.from.role} • Wants to join {invite.teamName}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => rejectTeamInvite(invite.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-10 px-4 rounded-xl border border-stone-200 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 active:scale-95 transition-all cursor-pointer text-stone-500 font-bold"
                                            >
                                                <XCircle className="w-4 h-4 mr-1" /> Reject
                                            </Button>
                                            <Button
                                                onClick={() => handleAcceptInvite(invite.id, invite.from)}
                                                size="sm"
                                                className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold active:scale-95 transition-all shadow-md cursor-pointer"
                                            >
                                                <Check className="w-4 h-4 mr-1" /> Accept
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {team.map((member) => (
                            <motion.div
                                layout
                                key={member.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white border border-stone-200/80 shadow-md p-6 rounded-3xl group hover:border-primary/40 hover:shadow-lg transition-all duration-500 relative overflow-hidden"
                            >
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-500/10 flex items-center justify-center text-xl font-black border border-stone-200 text-primary group-hover:border-primary/40 group-hover:bg-primary/15 transition-all shadow-md">
                                            {member.avatar}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl tracking-tight text-stone-800">{member.name}</h3>
                                            <div className="text-[10px] uppercase font-mono tracking-widest text-stone-500">{member.role}</div>
                                            <div className="mt-1.5 flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-primary" />
                                                <span className="text-[9px] font-bold text-primary/60 uppercase tracking-tighter">
                                                    {member.commits} Commits
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => removeMember(member.id)}
                                        variant="ghost"
                                        className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center border border-stone-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-90 cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    {member.skills.map(s => (
                                        <Badge key={s} variant="outline" className="bg-stone-50 border-stone-250 text-[9px] font-bold uppercase py-0.5 px-3 rounded-lg text-stone-600">{s}</Badge>
                                    ))}
                                    <Badge className="ml-auto bg-primary/20 text-primary border-primary/30 text-[9px] py-0.5 font-black uppercase italic">{member.style}</Badge>
                                </div>
                            </motion.div>
                        ))}

                        <Button
                            variant="ghost"
                            onClick={toggleFriendsPanel}
                            className="h-full min-h-[160px] w-full rounded-3xl border-2 border-dashed border-stone-200/80 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-4 group active:scale-[0.98] cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200 group-hover:border-primary/40 group-hover:scale-110 transition-all">
                                <Plus className="w-6 h-6 text-stone-500 group-hover:text-primary" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-stone-500 group-hover:text-primary transition-all">Recruit Teammate</span>
                        </Button>
                    </div>

                    {/* AI Matchmaking Simulation */}
                    <Card className="bg-white border border-stone-200/80 shadow-md p-10 rounded-[3rem] relative overflow-hidden bg-primary/[0.01] group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                            <Brain className="w-40 h-40 text-primary" />
                        </div>
                        <CardHeader className="p-0 mb-8">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-4 text-stone-900 leading-none">
                                    <Activity className="w-8 h-8 text-primary" />
                                    AI Matchmaking
                                </CardTitle>
                                <Badge className="bg-primary/20 text-primary border-primary/30 animate-pulse px-4 py-1 rounded-full text-[10px] font-black uppercase">Active Analysis</Badge>
                            </div>
                            <CardDescription className="text-stone-400 font-mono text-[10px] uppercase tracking-widest pl-12 mt-2">Neural Candidate Search Protocol 4.0</CardDescription>
                        </CardHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-6">
                                <p className="text-sm text-stone-600 leading-relaxed font-semibold">Scanning global talent pools for <strong>DevOps Architecture</strong> and <strong>Cloud Orchestration</strong> specialists to solve current bottlenecks.</p>
                                <Button
                                    className="w-full h-14 bg-primary text-white hover:bg-stone-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow active:scale-95 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                                        Initialize Radar Scan
                                    </div>
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-5 rounded-3xl bg-stone-50 border border-stone-200/60 flex items-center justify-between group/match hover:border-primary/40 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold border border-primary/20 text-primary group-hover/match:bg-primary group-hover/match:text-white transition-all">
                                            ML
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-stone-800">Marcus Lead</h4>
                                            <div className="text-[9px] uppercase font-mono tracking-widest text-primary">Match Found (98%)</div>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="rounded-xl border border-stone-200 hover:bg-stone-900 hover:text-white text-[10px] font-black uppercase active:scale-95 hover:scale-105 transition-all cursor-pointer">Invite</Button>
                                </div>
                                <div className="p-5 rounded-3xl bg-stone-50/50 border border-stone-200/30 flex items-center justify-between opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-lg font-bold border border-stone-200 text-stone-500">
                                            SY
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-stone-700">Sarah Yang</h4>
                                            <div className="text-[9px] uppercase font-mono tracking-widest text-stone-400">Pending Analysis...</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Team Health Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="bg-white border border-stone-200/80 shadow-2xl p-8 rounded-[2.5rem] relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-50 blur-3xl -z-10" />
                        <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 flex items-center gap-2">
                                    Team Health
                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[7px] py-0 px-2 rounded-full">Pulse Synced</Badge>
                                </CardTitle>
                                <div className="text-4xl font-black text-stone-850 mt-1">82<span className="text-primary text-xl">%</span></div>
                                <div className="mt-2.5 text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                                    Total Commits: <span className="text-primary font-bold">1,280</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                        </CardHeader>

                        <div className="h-64 w-full -mx-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={HEALTH_DATA} cx="50%" cy="50%" outerRadius="70%">
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#78716c", fontSize: 10, fontWeight: 850 }} />
                                    <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-4 pt-6">
                            {SKILL_GAPS.map((gap, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`flex items-start gap-4 p-4 rounded-2xl ${gap.bg} hover:scale-[1.02] transition-transform`}
                                >
                                    <gap.icon className={`w-5 h-5 ${gap.color} mt-0.5`} />
                                    <div>
                                        <div className={`text-[10px] font-black ${gap.color} uppercase tracking-widest`}>{gap.intensity} Gap</div>
                                        <p className="text-[11px] text-stone-600 mt-1 font-semibold leading-relaxed">
                                            No <strong>{gap.skill}</strong> found in current squad.
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                                <Rocket className="w-5 h-5 text-indigo-600 mt-0.5" />
                                <div>
                                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Style Balance</div>
                                    <p className="text-[11px] text-stone-600 mt-1 font-semibold">Excellent <strong>Builder-Thinker</strong> ratio.</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Live Activity Feed */}
                    <Card className="bg-stone-50 border border-stone-200/80 p-8 rounded-[2.5rem]">
                        <ActivityFeed maxItems={5} />
                    </Card>

                    {/* Quick Actions */}
                    <div className="flex gap-3">
                        <Button
                            onClick={toggleChat}
                            variant="ghost"
                            className="flex-1 h-14 rounded-2xl border border-stone-200 hover:border-primary/30 hover:bg-primary/5 gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-primary transition-all active:scale-95 cursor-pointer bg-white"
                        >
                            <MessageSquare className="w-4 h-4" /> Team Chat
                        </Button>
                        <Button
                            onClick={toggleFriendsPanel}
                            variant="ghost"
                            className="flex-1 h-14 rounded-2xl border border-stone-200 hover:border-emerald-500/30 hover:bg-emerald-50/5 gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-emerald-700 transition-all active:scale-95 cursor-pointer bg-white"
                        >
                            <UserPlus className="w-4 h-4" /> Invite
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
