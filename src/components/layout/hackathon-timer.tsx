"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Zap, AlertCircle } from "lucide-react";

export function HackathonTimer() {
    const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                const updated = prev - 1;
                if (updated < 3600) setIsUrgent(true); // Less than 1 hour left
                return updated > 0 ? updated : 0;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`glass-premium relative px-8 py-4 rounded-[2rem] border-foreground/10 flex items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] group backdrop-blur-2xl ${isUrgent ? 'border-orange-500/40 shadow-orange-500/20' : 'hover:border-primary/40 transition-all duration-500'}`}
            >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isUrgent ? 'bg-orange-500/20 border-orange-500/40 animate-pulse text-orange-400' : 'bg-primary/20 border-primary/40 text-primary group-hover:bg-primary group-hover:text-background'}`}>
                    {isUrgent ? <AlertCircle className="w-6 h-6" /> : <Timer className="w-6 h-6" />}
                </div>

                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-1">
                        {isUrgent ? "Submission Deadline Approaching" : "Hackathon Time Remaining"}
                    </div>
                    <div className={`text-3xl font-black font-mono tracking-tighter ${isUrgent ? 'text-orange-400 animate-pulse' : 'text-foreground'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="h-10 w-px bg-foreground/10 hidden md:block" />

                <div className="hidden md:flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-primary">3 Team Submissions Active</div>
                </div>

                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                />
            </motion.div>
        </div>
    );
}
