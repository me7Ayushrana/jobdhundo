"use client";

import { motion } from "framer-motion";
import { Terminal as Github, MessageSquare, Briefcase, Award, CheckCircle2, ChevronRight } from "lucide-react";
import { UserProfile, MatchResult } from "@/lib/utils/matching";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ConnectionCardProps {
  match: MatchResult;
  onChat: (user: UserProfile) => void;
}

export function ConnectionCard({ match, onChat }: ConnectionCardProps) {
  const { user, score, reasons, dna } = match;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (s >= 60) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.06)" }}
      className="p-6 bg-white border border-black/5 rounded-2xl flex flex-col justify-between h-[360px] shadow-sm relative overflow-hidden group"
    >
      {/* Bio / Title */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary/60 text-white flex items-center justify-center font-black text-lg shadow-md shadow-primary/10">
              {user.avatar || user.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-stone-900 leading-tight">
                {user.name}
              </h3>
              <a
                href={`https://github.com/${user.github}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-stone-400 hover:text-primary transition-colors flex items-center gap-1 mt-0.5"
              >
                <Github className="w-3.5 h-3.5" /> @{user.github}
              </a>
            </div>
          </div>

          {/* Compatibility score badge */}
          <div className={`text-xs font-black py-1 px-2.5 rounded-full border ${getScoreColor(score)}`}>
            {score}% Compatibility
          </div>
        </div>

        {/* Company & Referrals */}
        {user.company && (
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
              <Briefcase className="w-4 h-4 text-stone-400" />
              <span>{user.company}</span>
            </div>
            {user.canRefer && (
              <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] uppercase font-black py-0.5 rounded-full">
                Can Refer 🚀
              </Badge>
            )}
          </div>
        )}

        {/* DNA details */}
        <div className="flex items-center gap-1.5 mb-4">
          <Badge variant="outline" className="text-[10px] font-bold text-stone-500 uppercase py-0 px-2 rounded-full bg-stone-50 border-none">
            {user.role}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-bold text-stone-500 uppercase py-0 px-2 rounded-full bg-stone-50 border-none">
            {dna.type}
          </Badge>
        </div>

        {/* Reasons */}
        <div className="space-y-2 mb-4">
          {reasons.slice(0, 2).map((reason, rIdx) => (
            <div key={rIdx} className="flex items-center gap-2 text-xs text-stone-500 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="line-clamp-1">{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 border-t border-stone-50 pt-4 mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`https://github.com/${user.github}`, "_blank")}
          className="flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl border-stone-200 hover:bg-stone-50"
        >
          View Profile
        </Button>
        <Button
          size="sm"
          onClick={() => onChat(user)}
          className="flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl bg-primary text-white hover:bg-primary/95 flex items-center justify-center gap-1 shadow-md shadow-primary/10 transition-transform active:scale-95"
        >
          Chat <MessageSquare className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}
