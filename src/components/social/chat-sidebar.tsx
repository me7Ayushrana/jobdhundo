"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocial } from "@/components/providers/social-context";
import {
    MessageSquare, X, Send, Users, Circle, ChevronLeft, Hash, User
} from "lucide-react";

function timeStr(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatSidebar() {
    const {
        conversations, isChatOpen, activeChatId, currentUser,
        openChat, closeChat, sendMessage, toggleChat, getUserById,
    } = useSocial();

    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const activeConv = conversations.find(c => c.id === activeChatId);

    // Auto-scroll on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeConv?.messages.length]);

    // Simulated typing indicator
    useEffect(() => {
        if (!activeConv) return;
        const msgs = activeConv.messages;
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.senderId === currentUser.id) {
            setIsTyping(true);
            const timer = setTimeout(() => setIsTyping(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [activeConv?.messages.length, activeConv, currentUser.id]);

    const handleSend = () => {
        if (!input.trim() || !activeChatId) return;
        sendMessage(activeChatId, input);
        setInput("");
    };

    return (
        <AnimatePresence>
            {isChatOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-sm"
                        onClick={closeChat}
                    />
                    <motion.div
                        initial={{ x: 420, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 420, opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 280 }}
                        className="fixed top-0 right-0 bottom-0 w-[400px] z-[260] glass-premium border-l border-border shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                            <div className="flex items-center gap-3">
                                {activeChatId ? (
                                    <button onClick={() => openChat("")} className="w-8 h-8 rounded-lg hover:bg-foreground/10 flex items-center justify-center transition-colors">
                                        <ChevronLeft className="w-4 h-4 text-stone-500" />
                                    </button>
                                ) : (
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                        <MessageSquare className="w-5 h-5 text-primary" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-black text-sm tracking-tight text-foreground">
                                        {activeConv ? activeConv.name : "Messages"}
                                    </h3>
                                    {activeConv && (
                                        <p className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase font-black">
                                            {activeConv.type === "team" ? `${activeConv.participants.length} members` : "Direct message"}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button onClick={closeChat} className="w-8 h-8 rounded-lg hover:bg-foreground/10 flex items-center justify-center transition-colors">
                                <X className="w-4 h-4 text-stone-500" />
                            </button>
                        </div>

                        {/* Content */}
                        {!activeChatId || !activeConv ? (
                            /* Conversation List */
                            <div className="overflow-y-auto flex-1 py-2">
                                <div className="px-5 py-2">
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500 mb-3">Conversations</h4>
                                </div>
                                {conversations.map((conv) => {
                                    const otherUser = conv.participants.find(p => p.id !== currentUser.id);
                                    const lastMsg = conv.messages[conv.messages.length - 1];
                                    return (
                                        <motion.div
                                            key={conv.id}
                                            whileHover={{ x: 4 }}
                                            onClick={() => openChat(conv.id)}
                                            className="px-5 py-3 flex items-center gap-3 hover:bg-foreground/[0.03] cursor-pointer transition-all group"
                                        >
                                            <div className="relative">
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center text-sm font-black border border-border group-hover:border-primary/40 transition-all text-foreground">
                                                    {conv.type === "team" ? <Hash className="w-5 h-5 text-primary" /> : (otherUser?.avatar || "?")}
                                                </div>
                                                {conv.type === "direct" && otherUser?.isOnline && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background bg-emerald-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{conv.name}</h5>
                                                    <span className="text-[9px] font-mono text-stone-400">{timeStr(conv.lastActivity)}</span>
                                                </div>
                                                {lastMsg && (
                                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                        {lastMsg.senderId === currentUser.id ? "You: " : ""}{lastMsg.text}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Message View */
                            <>
                                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
                                    {activeConv.messages.map((msg) => {
                                        const isSelf = msg.senderId === currentUser.id;
                                        const sender = getUserById(msg.senderId);
                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                                            >
                                                <div className={`max-w-[80%] ${isSelf ? "order-2" : "order-1"}`}>
                                                    {!isSelf && activeConv.type === "team" && (
                                                        <p className="text-[9px] font-bold text-primary/80 mb-1 ml-1">{sender?.name}</p>
                                                    )}
                                                    <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${isSelf
                                                            ? "bg-primary text-white rounded-tr-sm font-medium"
                                                            : "bg-foreground/[0.06] text-foreground rounded-tl-sm border border-border/60"
                                                        }`}>
                                                        {msg.text}
                                                    </div>
                                                    <p className={`text-[9px] font-mono text-stone-400 mt-1 ${isSelf ? "text-right mr-1" : "ml-1"}`}>
                                                        {timeStr(msg.timestamp)}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {/* Typing Indicator */}
                                    <AnimatePresence>
                                        {isTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 5 }}
                                                className="flex justify-start"
                                            >
                                                <div className="px-4 py-3 rounded-2xl bg-foreground/[0.06] border border-border/60 rounded-tl-sm flex gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div ref={bottomRef} />
                                </div>

                                {/* Input */}
                                <div className="px-4 py-3 border-t border-border/60">
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                            placeholder="Type a message..."
                                            className="flex-1 h-11 px-4 bg-foreground/[0.03] border border-border rounded-xl text-sm outline-none focus:border-primary/30 transition-colors placeholder:text-stone-400 text-foreground"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim()}
                                            className="w-11 h-11 rounded-xl bg-primary hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-90"
                                        >
                                            <Send className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
