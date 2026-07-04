"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useSocial } from "@/components/providers/social-context";
import { NotificationPanel } from "@/components/social/notification-panel";
import { FriendsPanel } from "@/components/social/friends-panel";
import { ChatSidebar } from "@/components/social/chat-sidebar";
import { AuthModal } from "./auth-modal";

export function Navbar() {
    const { 
        isAuthenticated,
        currentUser,
        logout,
        isAuthModalOpen,
        setAuthModalOpen
    } = useSocial();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 right-0 z-[200] flex justify-center p-6 bg-transparent pointer-events-none"
            >
                <div className="w-full max-w-7xl relative">
                    <nav className="glass px-6 md:px-8 py-3.5 rounded-[32px] flex items-center justify-between w-full animate-in fade-in slide-in-from-top-4 duration-1000 border-black/5 relative pointer-events-auto shadow-2xl">
                        <Link href="/" className="relative z-10">
                            <span className="text-xl md:text-2xl font-black tracking-tighter text-stone-900 dark:text-white uppercase italic">Job Dhundo!</span>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:flex items-center gap-7 font-bold text-[11px] uppercase tracking-[0.15em] text-stone-700 dark:text-stone-300 relative z-10">
                            <Link href="/jobs" className="hover:text-primary transition-colors active:scale-95 transition-transform">
                                Jobs
                            </Link>
                            <Link href="/network" className="hover:text-primary transition-colors active:scale-95 transition-transform">
                                Network
                            </Link>
                            <Link href="/analyzer" className="hover:text-primary transition-colors active:scale-95 transition-transform">
                                Analyzer
                            </Link>
                            <Link href="/dashboard" className="hover:text-primary transition-colors active:scale-95 transition-transform">
                                Dashboard
                            </Link>
                        </div>

                        {/* Desktop Action Right Section */}
                        <div className="hidden md:flex items-center gap-7 font-bold text-[11px] uppercase tracking-[0.15em] text-stone-700 dark:text-stone-300 relative z-10">
                            <a
                                href="https://workstack-ai.vercel.app/"
                                target="_blank"
                                className="hidden lg:block hover:text-primary transition-colors active:scale-95 transition-transform"
                            >
                                Boost Workflow
                            </a>
                            
                            {isAuthenticated ? (
                                <div className="flex items-center gap-5">
                                    <span className="text-stone-500 dark:text-stone-400 font-bold lowercase tracking-normal text-xs normal-case border-r border-stone-200 dark:border-stone-800 pr-5">
                                        @{currentUser.github || currentUser.name.toLowerCase().replace(/\s+/g, "")}
                                    </span>
                                    <button
                                        onClick={logout}
                                        className="hover:text-primary transition-colors cursor-pointer active:scale-95 font-bold text-[11px] uppercase tracking-[0.15em]"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAuthModalOpen(true)}
                                    className="hover:text-primary transition-colors cursor-pointer active:scale-95 font-bold text-[11px] uppercase tracking-[0.15em]"
                                >
                                    Sign In
                                </button>
                            )}
                            
                            <Link href="/jobs" className="text-primary hover:text-primary/80 transition-colors active:scale-95 transition-transform font-black">
                                Find Jobs
                            </Link>
                        </div>

                        {/* Mobile Actions: Hamburger only */}
                        <div className="flex md:hidden items-center gap-2 relative z-10">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 text-stone-755 hover:text-primary transition-colors cursor-pointer rounded-full hover:bg-stone-100/80"
                                aria-label="Toggle Mobile Menu"
                            >
                                {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
                            </button>
                        </div>
                    </nav>

                    {/* Mobile Dropdown Panel Menu */}
                    <AnimatePresence>
                        {isMobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-[68px] left-2 right-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[28px] p-6 shadow-2xl pointer-events-auto flex flex-col gap-4 text-left"
                            >
                                <div className="flex flex-col gap-3.5 font-extrabold text-xs uppercase tracking-[0.1em] text-stone-700 dark:text-stone-300">
                                    <Link 
                                        href="/jobs" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="py-2 hover:text-primary border-b border-stone-100 dark:border-stone-850"
                                    >
                                        Jobs Feed
                                    </Link>
                                    <Link 
                                        href="/network" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="py-2 hover:text-primary border-b border-stone-100 dark:border-stone-850"
                                    >
                                        Developer Network
                                    </Link>
                                    <Link 
                                        href="/analyzer" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="py-2 hover:text-primary border-b border-stone-100 dark:border-stone-850"
                                    >
                                        DNA Analyzer
                                    </Link>
                                    <Link 
                                        href="/dashboard" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="py-2 hover:text-primary border-b border-stone-100 dark:border-stone-850"
                                    >
                                        Command Center Dashboard
                                    </Link>
                                </div>

                                <div className="pt-2 flex flex-col gap-3 font-bold text-xs uppercase tracking-[0.1em]">
                                    <a
                                        href="https://workstack-ai.vercel.app/"
                                        target="_blank"
                                        className="py-2 text-stone-650 dark:text-stone-400 hover:text-primary"
                                    >
                                        Boost Workflow ↗
                                    </a>
                                    
                                    {isAuthenticated ? (
                                        <div className="flex items-center justify-between py-2 border-t border-stone-100 dark:border-stone-850 pt-4">
                                            <span className="text-stone-500 lowercase tracking-normal text-xs normal-case">
                                                @{currentUser.github || currentUser.name.toLowerCase().replace(/\s+/g, "")}
                                            </span>
                                            <button
                                                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                                className="text-stone-750 dark:text-stone-300 hover:text-primary"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                                            className="w-full text-left py-2.5 border-t border-stone-100 dark:border-stone-850 pt-4 text-stone-750 dark:text-stone-300 hover:text-primary"
                                        >
                                            Sign In
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
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
