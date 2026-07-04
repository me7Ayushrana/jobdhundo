"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
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
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Guard hydration mismatch
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
                    <nav className="bg-stone-900 border border-stone-800/80 px-6 md:px-8 py-3.5 rounded-[32px] flex items-center justify-between w-full animate-in fade-in slide-in-from-top-4 duration-1000 relative pointer-events-auto shadow-2xl">
                        <Link href="/" className="relative z-10 flex items-center">
                            <span className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic">Job Dhundo!</span>
                        </Link>

                        {/* Desktop Navigation Links (Clean Premium Grey-to-White hover) */}
                        <div className="hidden md:flex items-center gap-7 font-bold text-[11px] uppercase tracking-[0.15em] text-stone-300 relative z-10">
                            <Link href="/jobs" className="hover:text-white transition-colors active:scale-95 transition-transform">
                                Jobs
                            </Link>
                            <Link href="/network" className="hover:text-white transition-colors active:scale-95 transition-transform">
                                Network
                            </Link>
                            <Link href="/analyzer" className="hover:text-white transition-colors active:scale-95 transition-transform">
                                Analyzer
                            </Link>
                            <Link href="/dashboard" className="hover:text-white transition-colors active:scale-95 transition-transform">
                                Dashboard
                            </Link>
                        </div>

                        {/* Desktop Action Right Section */}
                        <div className="hidden md:flex items-center gap-7 font-bold text-[11px] uppercase tracking-[0.15em] text-stone-300 relative z-10">
                            <a
                                href="https://workstack-ai.vercel.app/"
                                target="_blank"
                                className="hidden lg:block hover:text-white transition-colors active:scale-95 transition-transform"
                            >
                                Boost Workflow
                            </a>
                            <Link href="/jobs" className="text-primary hover:text-primary/80 transition-colors active:scale-95 transition-transform font-black">
                                Find Jobs
                            </Link>

                            {mounted && isAuthenticated ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center justify-center rounded-full border border-stone-800 focus:outline-none hover:border-primary/50 transition-all cursor-pointer overflow-hidden bg-stone-800 text-white font-black text-[12px] uppercase w-8 h-8 select-none"
                                        aria-label="User Profile"
                                    >
                                        {currentUser.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={currentUser.avatarUrl}
                                                alt={currentUser.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            currentUser.avatar
                                        )}
                                    </button>

                                    {/* Premium Dropdown menu */}
                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <>
                                                {/* Backdrop to capture clicks outside */}
                                                <div 
                                                    className="fixed inset-0 z-40 bg-transparent cursor-default" 
                                                    onClick={() => setIsProfileOpen(false)} 
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute right-0 mt-3 w-56 bg-stone-900 border border-stone-850 rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-3 text-left pointer-events-auto"
                                                >
                                                    <div className="flex items-center gap-3 pb-3 border-b border-stone-850">
                                                        <div className="w-10 h-10 rounded-full bg-stone-850 border border-stone-800 overflow-hidden flex items-center justify-center font-extrabold text-white text-sm shrink-0">
                                                            {currentUser.avatarUrl ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={currentUser.avatarUrl}
                                                                    alt={currentUser.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                currentUser.avatar
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-black text-white truncate leading-tight">{currentUser.name}</span>
                                                            <span className="text-[10px] font-bold text-stone-500 truncate mt-0.5">@{currentUser.github}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            logout();
                                                            setIsProfileOpen(false);
                                                        }}
                                                        className="w-full py-2 bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors rounded-xl font-black text-[10px] uppercase tracking-widest text-center cursor-pointer border-transparent"
                                                    >
                                                        Sign Out
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAuthModalOpen(true)}
                                    className="hover:text-white transition-colors cursor-pointer active:scale-95 font-bold text-[11px] uppercase tracking-[0.15em] bg-transparent border-none"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>

                        {/* Mobile Actions: Hamburger only */}
                        <div className="flex md:hidden items-center gap-2 relative z-10">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 text-stone-300 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-stone-800"
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
                                className="absolute top-[68px] left-2 right-2 bg-stone-900 border border-stone-800 rounded-[28px] p-6 shadow-2xl pointer-events-auto flex flex-col gap-4 text-left"
                            >
                                <div className="flex flex-col gap-3.5 font-extrabold text-xs uppercase tracking-[0.1em] text-stone-300">
                                    <Link 
                                        href="/jobs" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="py-2 hover:text-white border-b border-stone-800"
                                    >
                                        Jobs Feed
                                    </Link>
                                    <Link 
                                        href="/network" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="py-2 hover:text-white border-b border-stone-800"
                                    >
                                        Developer Network
                                    </Link>
                                    <Link 
                                        href="/analyzer" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="py-2 hover:text-white border-b border-stone-800"
                                    >
                                        DNA Analyzer
                                    </Link>
                                    <Link 
                                        href="/dashboard" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="py-2 hover:text-white border-b border-stone-800"
                                    >
                                        Command Center Dashboard
                                    </Link>
                                </div>

                                <div className="pt-2 flex flex-col gap-3 font-bold text-xs uppercase tracking-[0.1em] text-stone-300">
                                    <a
                                        href="https://workstack-ai.vercel.app/"
                                        target="_blank"
                                        className="py-2 text-stone-400 hover:text-white"
                                    >
                                        Boost Workflow ↗
                                    </a>
                                    
                                    {mounted && isAuthenticated ? (
                                        <div className="flex items-center justify-between py-2 border-t border-stone-800 pt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-750 overflow-hidden flex items-center justify-center font-black text-white text-xs">
                                                    {currentUser.avatarUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={currentUser.avatarUrl}
                                                            alt={currentUser.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        currentUser.avatar
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-white leading-tight">{currentUser.name}</span>
                                                    <span className="text-[10px] font-bold text-stone-500">@{currentUser.github}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                                className="text-stone-400 hover:text-white font-extrabold text-[10px] uppercase tracking-wider py-1 px-3 bg-stone-800 hover:bg-stone-750 rounded-lg cursor-pointer border-transparent"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                                            className="w-full text-left py-2.5 border-t border-stone-800 pt-4 text-stone-300 hover:text-white bg-transparent border-none"
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
