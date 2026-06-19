"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSocial } from "@/components/providers/social-context";
import {
    Bell, X, UserPlus, Users, Zap, Trophy, Brain, ChevronRight,
    CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles
} from "lucide-react";
import type { NotificationType } from "@/lib/types/social-types";

const NOTIF_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
    friend_request: { icon: UserPlus, color: "text-blue-400", bg: "bg-blue-500/10" },
    team_invite: { icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    match_found: { icon: Zap, color: "text-primary", bg: "bg-primary/10" },
    hackathon_alert: { icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10" },
    smart_suggestion: { icon: Brain, color: "text-pink-400", bg: "bg-pink-500/10" },
};

function timeAgo(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationPanel() {
    const {
        notifications, isNotificationPanelOpen, toggleNotificationPanel,
        markNotificationRead, markAllNotificationsRead, dismissNotification, unreadCount,
    } = useSocial();

    return (
        <AnimatePresence>
            {isNotificationPanelOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-sm"
                        onClick={toggleNotificationPanel}
                    />
                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed top-24 right-6 w-[420px] max-h-[70vh] z-[260] glass-premium rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                    <Bell className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm tracking-tight text-foreground">Notifications</h3>
                                    <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-black">{unreadCount} unread</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllNotificationsRead}
                                        className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-stone-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-foreground/5"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={toggleNotificationPanel}
                                    className="w-8 h-8 rounded-lg hover:bg-foreground/10 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4 text-stone-500" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1 py-2">
                            {notifications.length === 0 ? (
                                <div className="py-16 text-center space-y-3">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto" />
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">All caught up!</p>
                                </div>
                            ) : (
                                notifications.map((notif, idx) => {
                                    const config = NOTIF_CONFIG[notif.type];
                                    const Icon = config.icon;
                                    return (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => markNotificationRead(notif.id)}
                                            className={`px-5 py-4 flex items-start gap-4 hover:bg-foreground/[0.03] cursor-pointer transition-all group relative ${!notif.read ? "bg-foreground/[0.02]" : ""}`}
                                        >
                                            {!notif.read && (
                                                <div className="absolute top-5 left-2 w-1.5 h-1.5 rounded-full bg-primary shadow-glow" />
                                            )}
                                            <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0 border border-border/40`}>
                                                <Icon className={`w-5 h-5 ${config.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={`text-xs font-black tracking-tight ${!notif.read ? "text-foreground font-extrabold" : "text-foreground/70"}`}>{notif.title}</h4>
                                                    <span className="text-[9px] font-mono text-stone-400 shrink-0">{timeAgo(notif.timestamp)}</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed">{notif.message}</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                                                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-foreground/10 flex items-center justify-center transition-all shrink-0"
                                            >
                                                <X className="w-3 h-3 text-stone-400" />
                                            </button>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
