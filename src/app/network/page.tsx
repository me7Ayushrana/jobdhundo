"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Users, ShieldCheck, Sparkles, HelpCircle, Briefcase } from "lucide-react";
import { useSocial } from "@/components/providers/social-context";
import { MOCK_USERS, calculateMatch, UserProfile } from "@/lib/utils/matching";
import { ConnectionCard } from "@/components/network/connection-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NetworkPage() {
  const { currentUser, openDirectChat } = useSocial();
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyReferrers, setOnlyReferrers] = useState(false);

  // Compute matches for all mock users compared to current user
  const matches = useMemo(() => {
    // Current user profile mapping
    const curProfile: UserProfile = {
      name: currentUser?.name || "Guest Developer",
      github: currentUser?.github || "devmatch_guest",
      role: (currentUser?.role || "Frontend") as any,
      skills: currentUser?.skills || ["React", "TypeScript", "TailwindCSS"],
      style: (currentUser?.style || "Builder") as any
    };

    return MOCK_USERS.map(user => {
      const matchResult = calculateMatch(curProfile, user);
      return matchResult;
    });
  }, [currentUser]);

  // Filter connections by search term and referrer toggles
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const { user } = match;
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesReferrer = !onlyReferrers || user.canRefer;

      return matchesSearch && matchesReferrer;
    });
  }, [matches, searchTerm, onlyReferrers]);

  const handleChat = (user: UserProfile) => {
    if (user.id) {
      openDirectChat(user.id);
    }
  };

  const handleQuickSearch = (company: string) => {
    setSearchTerm(company);
  };

  return (
    <div className="relative min-h-screen bg-stone-50 pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-7xl space-y-8">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            Professional Network <Users className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-xs text-stone-500 font-semibold mt-1">
            Connect with referrers and professionals at top engineering organizations
          </p>
        </div>

        {/* Dashboard Bar: Searches, Filters, Quick Companies */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          {/* Search Inputs */}
          <div className="lg:col-span-3 bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-stone-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Who can refer me to Google? or search skills..."
                className="pl-10 h-12 bg-stone-50 border-stone-200 text-xs rounded-xl"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-black uppercase tracking-wider text-stone-700 shrink-0 px-2 py-3 border border-transparent hover:bg-stone-50 rounded-xl transition-all">
              <input
                type="checkbox"
                checked={onlyReferrers}
                onChange={(e) => setOnlyReferrers(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-primary focus:ring-primary"
              />
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Only Referrers</span>
            </label>
          </div>

          {/* Quick company links */}
          <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex flex-col justify-center space-y-2">
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Quick Referrals</span>
            <div className="flex flex-wrap gap-1.5">
              {["Google", "Meta", "Vercel", "Netflix", "Microsoft"].map(company => (
                <button
                  key={company}
                  onClick={() => handleQuickSearch(company)}
                  className={`text-[10px] font-bold py-1 px-3 rounded-full border transition-all ${
                    searchTerm === company
                      ? "bg-primary text-white border-primary"
                      : "bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-800 hover:border-primary/40 text-stone-600 dark:text-stone-300"
                  }`}
                >
                  {company}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Connections Grid */}
        {filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match, idx) => (
              <ConnectionCard
                key={match.user.id || idx}
                match={match}
                onChat={handleChat}
              />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-white border border-black/5 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">No connections match your filters</h3>
            <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto">
              Try searching for a different company name, or uncheck the "Only Referrers" box to see more candidate options.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setOnlyReferrers(false);
              }}
              className="bg-primary text-white font-bold text-xs uppercase py-2 px-6 rounded-xl shadow-md"
            >
              Reset Filters
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
