"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Terminal as GithubIcon, Users, Zap, LayoutDashboard, Sparkles, ShieldCheck, Bell, MessageSquare, Sun, Moon } from "lucide-react";
import { useSocial } from "@/components/providers/social-context";
import { NotificationPanel } from "@/components/social/notification-panel";
import { FriendsPanel } from "@/components/social/friends-panel";
import { ChatSidebar } from "@/components/social/chat-sidebar";
import { AuthModal } from "./auth-modal";

export function Navbar() {
    const { 
        toggleFriendsPanel, 
        toggleNotificationPanel, 
        toggleChat, 
        unreadCount, 
        onlineFriendsCount, 
        pendingFriendRequests,
        isAuthenticated,
        currentUser,
        logout,
        isAuthModalOpen,
        setAuthModalOpen
    } = useSocial();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const totalFriendBadge = pendingFriendRequests.length;

    return (
        <>
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 right-0 z-[200] flex justify-center p-6 bg-transparent pointer-events-none"
            >
                <nav className="glass px-8 py-3.5 rounded-full flex items-center justify-between w-full max-w-7xl animate-in fade-in slide-in-from-top-4 duration-1000 border-black/5 relative pointer-events-auto shadow-2xl">
                    <Link href="/" className="relative z-10">
                        <span className="text-2xl font-black tracking-tighter text-stone-900 uppercase italic">DevMatch</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-7 font-bold text-[11px] uppercase tracking-[0.15em] text-stone-700 relative z-10">
                        <Link href="/jobs" className="hover:text-primary text-stone-700 transition-colors active:scale-95 transition-transform">
                            Jobs
                        </Link>
                        <Link href="/network" className="hover:text-primary text-stone-700 transition-colors active:scale-95 transition-transform">
                            Network
                        </Link>
                        <Link href="/analyzer" className="hover:text-primary text-stone-700 transition-colors active:scale-95 transition-transform">
                            Analyzer
                        </Link>
                        <Link href="/dashboard" className="hover:text-primary text-stone-700 transition-colors active:scale-95 transition-transform">
                            Dashboard
                        </Link>
                    </div>

                    <div className="flex items-center gap-7 font-bold text-[11px] uppercase tracking-[0.15em] text-stone-700 relative z-10">
                        <a
                            href="https://workstack-ai.vercel.app/"
                            target="_blank"
                            className="hidden lg:block text-stone-700 hover:text-primary transition-colors active:scale-95 transition-transform"
                        >
                            Boost Workflow
                        </a>
                        
                        {isAuthenticated ? (
                            <div className="flex items-center gap-5">
                                <span className="text-stone-500 font-bold lowercase tracking-normal text-xs normal-case border-r border-stone-200 pr-5">
                                    @{currentUser.github || currentUser.name.toLowerCase().replace(/\s+/g, "")}
                                </span>
                                <button
                                    onClick={logout}
                                    className="text-stone-700 hover:text-primary transition-colors cursor-pointer active:scale-95 font-bold text-[11px] uppercase tracking-[0.15em]"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAuthModalOpen(true)}
                                className="text-stone-700 hover:text-primary transition-colors cursor-pointer active:scale-95 font-bold text-[11px] uppercase tracking-[0.15em]"
                            >
                                Sign In
                            </button>
                        )}
                        
                        <Link href="/jobs" className="text-primary hover:text-primary/80 transition-colors active:scale-95 transition-transform font-black">
                            Find Jobs
                        </Link>
                    </div>
                </nav>
            </motion.header>

            {/* Social Panels */}
            <NotificationPanel />
            <FriendsPanel />
            <ChatSidebar />

            {/* Auth Modal */}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
        </>
    );
}
