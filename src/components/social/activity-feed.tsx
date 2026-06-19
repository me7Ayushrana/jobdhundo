"use client";

import { motion } from "framer-motion";
import { useSocial } from "@/components/providers/social-context";
import {
    Users, UserPlus, Trophy, Zap, Send, Rocket, Activity
} from "lucide-react";

const EVENT_CONFIG: Record<string, { icon: typeof Users; color: string }> = {
    team_join: { icon: Users, color: "text-emerald-400" },
    friend_added: { icon: UserPlus, color: "text-blue-400" },
    hackathon_new: { icon: Trophy, color: "text-amber-400" },
    match_found: { icon: Zap, color: "text-primary" },
    team_formed: { icon: Rocket, color: "text-pink-400" },
    invite_sent: { icon: Send, color: "text-cyan-400" },
};

function timeAgo(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export function ActivityFeed({ maxItems = 6 }: { maxItems?: number }) {
    const { activityFeed } = useSocial();
    const items = activityFeed.slice(0, maxItems);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-black">Live Activity</h4>
            </div>
            {items.map((event, idx) => {
                const config = EVENT_CONFIG[event.type] || { icon: Zap, color: "text-stone-400" };
                const Icon = config.icon;
                return (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3 py-2.5 group"
                    >
                        <div className={`w-7 h-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center shrink-0 border border-border/60 group-hover:border-primary/20 transition-all`}>
                            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-stone-600 leading-relaxed font-semibold">{event.message}</p>
                            <span className="text-[9px] font-mono text-stone-400">{timeAgo(event.timestamp)}</span>
                        </div>
                    </motion.div>
                );
            })}
            {items.length === 0 && (
                <div className="py-8 text-center">
                    <p className="text-xs text-stone-400">No activity yet</p>
                </div>
            )}
        </div>
    );
}
