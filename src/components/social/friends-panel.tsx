"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocial } from "@/components/providers/social-context";
import {
    Users, X, Search, UserPlus, MessageSquare, Check, XCircle,
    Circle, ChevronRight, Send
} from "lucide-react";

function timeAgo(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export function FriendsPanel() {
    const {
        friends, pendingFriendRequests, isFriendsPanelOpen, toggleFriendsPanel,
        acceptFriendRequest, rejectFriendRequest, openDirectChat, sendTeamInvite,
        onlineFriendsCount,
    } = useSocial();

    const [searchQ, setSearchQ] = useState("");

    const filteredFriends = friends.filter(f =>
        f.name.toLowerCase().includes(searchQ.toLowerCase()) ||
        f.role.toLowerCase().includes(searchQ.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isFriendsPanelOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-sm"
                        onClick={toggleFriendsPanel}
                    />
                    <motion.div
                        initial={{ x: -400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -400, opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 280 }}
                        className="fixed top-0 left-0 bottom-0 w-[380px] z-[260] glass-premium border-r border-border shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm tracking-tight text-foreground">Friends</h3>
                                    <p className="text-[10px] font-mono tracking-widest text-emerald-600 uppercase font-black">
                                        {onlineFriendsCount} online
                                    </p>
                                </div>
                            </div>
                            <button onClick={toggleFriendsPanel} className="w-8 h-8 rounded-lg hover:bg-foreground/10 flex items-center justify-center transition-colors">
                                <X className="w-4 h-4 text-stone-500" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="px-5 py-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    value={searchQ}
                                    onChange={(e) => setSearchQ(e.target.value)}
                                    placeholder="Search friends..."
                                    className="w-full h-10 pl-10 pr-4 bg-foreground/[0.03] border border-border rounded-xl text-xs outline-none focus:border-primary/30 transition-colors placeholder:text-stone-400 text-foreground"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {/* Pending Requests */}
                            {pendingFriendRequests.length > 0 && (
                                <div className="px-5 py-3">
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500 mb-3 flex items-center gap-2">
                                        <UserPlus className="w-3 h-3 text-primary" />
                                        Pending Requests ({pendingFriendRequests.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {pendingFriendRequests.map((req) => (
                                            <motion.div
                                                key={req.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center justify-between p-3 rounded-xl bg-foreground/[0.02] border border-border hover:border-primary/20 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center text-sm font-black border border-border text-foreground">
                                                        {req.from.avatar}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xs font-bold text-foreground">{req.from.name}</h5>
                                                        <p className="text-[9px] text-muted-foreground font-mono uppercase font-semibold">{req.from.role}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => acceptFriendRequest(req.id)}
                                                        className="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 flex items-center justify-center transition-all active:scale-90"
                                                    >
                                                        <Check className="w-4 h-4 text-emerald-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => rejectFriendRequest(req.id)}
                                                        className="w-8 h-8 rounded-lg bg-foreground/5 hover:bg-red-500/20 flex items-center justify-center transition-all active:scale-90"
                                                    >
                                                        <XCircle className="w-4 h-4 text-stone-400 hover:text-red-600" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            {pendingFriendRequests.length > 0 && (
                                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-5" />
                            )}

                            {/* Friends List */}
                            <div className="px-5 py-3">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500 mb-3">
                                    All Friends ({filteredFriends.length})
                                </h4>
                                <div className="space-y-1">
                                    {filteredFriends.map((friend) => (
                                        <motion.div
                                            key={friend.id}
                                            layout
                                            className="flex items-center justify-between p-3 rounded-xl hover:bg-foreground/[0.03] transition-all group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center text-sm font-black border border-border group-hover:border-primary/40 transition-all text-foreground">
                                                        {friend.avatar}
                                                    </div>
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${friend.isOnline ? "bg-emerald-500" : "bg-stone-300"}`} />
                                                </div>
                                                <div>
                                                    <h5 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{friend.name}</h5>
                                                    <p className="text-[9px] text-muted-foreground font-mono uppercase font-semibold">{friend.role} • {friend.style}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openDirectChat(friend.id); }}
                                                    className="w-8 h-8 rounded-lg bg-primary/20 hover:bg-primary/40 flex items-center justify-center transition-all active:scale-90"
                                                    title="Chat"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); sendTeamInvite(friend); }}
                                                    className="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 flex items-center justify-center transition-all active:scale-90"
                                                    title="Invite to Team"
                                                >
                                                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {filteredFriends.length === 0 && (
                                    <div className="py-12 text-center space-y-2">
                                        <Users className="w-8 h-8 text-stone-300 mx-auto" />
                                        <p className="text-xs text-stone-400">No friends found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
