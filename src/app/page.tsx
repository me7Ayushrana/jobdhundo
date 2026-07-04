"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Briefcase, Users, Code, Sparkles, ArrowRight, TrendingUp, ShieldCheck } from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/jobs");
    }
  };

  const handleChipClick = (type: "skill" | "location" | "remote" | "experience", val: string) => {
    if (type === "remote") {
      router.push("/jobs?remote=true");
    } else if (type === "skill") {
      router.push(`/jobs?skills=${encodeURIComponent(val)}`);
    } else if (type === "location") {
      router.push(`/jobs?location=${encodeURIComponent(val)}`);
    } else if (type === "experience") {
      router.push(`/jobs?experience=${encodeURIComponent(val.toLowerCase())}`);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-stone-50 text-stone-900 selection:bg-primary/20 overflow-hidden flex flex-col justify-center">
      
      {/* Subtle clean grid lines background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-[1]" />
      
      {/* Clean main section */}
      <section className="relative pt-36 pb-16 container mx-auto px-6 max-w-7xl z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Copywriting & Search */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Editorial Subtitle Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> India's Premium Job Aggregator
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.0] text-stone-900"
            >
              Job Dhundo!<br />
              <span className="text-primary">Find Your Next Move.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-stone-500 text-sm md:text-base leading-relaxed font-semibold max-w-xl"
            >
              Access internships, full-time engineering roles, and freelance gigs consolidated live from LinkedIn, Indeed, Naukri, Internshala, and 20+ other platforms. Upload your resume to map matching opportunities instantly.
            </motion.p>

            {/* Clean Professional Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-xl"
            >
              <form onSubmit={handleSearchSubmit} className="p-2.5 bg-white border border-stone-250 rounded-3xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.02)] focus-within:shadow-[0_8px_30px_rgba(220,76,32,0.04)] focus-within:border-primary transition-all duration-300">
                <div className="flex-1 flex items-center px-4 gap-3">
                  <Search className="w-5 h-5 text-stone-400 shrink-0" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search jobs by title, company, or tech stack..."
                    className="bg-transparent border-none text-stone-900 focus-visible:ring-0 placeholder:text-stone-400 h-12 text-sm font-semibold"
                  />
                </div>
                <Button
                  type="submit"
                  className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/95 text-white font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
                >
                  Find Openings <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </motion.div>

            {/* Quick Resume Upload Callout Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-xl pt-2"
            >
              <Link href="/analyzer" className="block group">
                <div className="p-4 bg-white border border-stone-250 hover:border-primary/50 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.015)] transition-all duration-300 flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/15 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                      AI Resume Matcher <span className="text-[8px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-extrabold normal-case tracking-normal">New</span>
                    </h4>
                    <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                      Upload your CV to automatically map skills and see matching score indicators across live listings.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: High-End Vector Illustration */}
          <div className="lg:col-span-5 flex justify-center relative">
            {/* Smooth backglow lighting */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-orange-500/5 rounded-[3rem] blur-3xl -z-10" />

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-3 bg-white border border-stone-200 rounded-[2.5rem] shadow-sm max-w-md overflow-hidden relative z-10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero_professional.png"
                alt="Professional Developers Collaboration"
                className="w-full h-auto rounded-[2rem] object-cover"
              />
            </motion.div>
          </div>

        </div>

        {/* Live Index Metrics as Premium Black Flashcards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-16 text-left"
        >
          {/* Card 1: Portals Index Card */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-7 shadow-xl text-left flex flex-col justify-between relative overflow-hidden group">
            {/* Glowing accent light */}
            <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Aggregated Portals Index</span>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-black text-white tracking-tight leading-none">
                  34,912
                </div>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">
                  Active Openings
                </div>
              </div>
            </div>
            <p className="text-[11px] text-stone-400 font-semibold leading-relaxed mt-6 border-t border-stone-800/60 pt-4">
              Consolidated, cleaned, and synced live from LinkedIn, Indeed, Naukri, Internshala, and 20+ other pipelines.
            </p>
          </div>

          {/* Card 2: Trending Keywords Card */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-7 shadow-xl text-left relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
            <div className="space-y-4">
              <span className="text-[10px] font-black text-stone-550 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Trending Keywords
              </span>
              
              <div className="flex flex-col gap-2 pt-1">
                {[
                  { term: "Web Development Internship", link: "/jobs?q=Web Development" },
                  { term: "Senior Frontend Engineer", link: "/jobs?q=Frontend" },
                  { term: "DevOps Infrastructure", link: "/jobs?q=DevOps" }
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.link}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-850 hover:border-primary/50 text-xs font-bold text-stone-300 hover:text-white transition-all duration-300 hover:bg-stone-950/90"
                  >
                    <span>{item.term}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </section>

      {/* Corporate Professional features */}
      <section className="py-20 border-t border-stone-200 bg-white/50 z-10 relative">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Briefcase, title: "Multi-Source Feeds", desc: "View software engineering vacancies, internships, and gigs unified into a single schema. Access details, eligibility, and descriptions on one dashboard." },
              { icon: Code, title: "Direct Screening Submittals", desc: "Apply directly by uploading your resume, parsing skills, and filling out custom company screening forms inside the workspace." },
              { icon: ShieldCheck, title: "Skills Alignment Scorer", desc: "Upload your CV to automatically map keywords and experience. The matcher rates every opportunity based on your actual tech stack usage." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-850 p-8 rounded-3xl flex flex-col items-start gap-4 shadow-xl hover:border-primary/30 transition-all duration-300 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white mb-1.5">{feature.title}</h3>
                  <p className="text-stone-400 leading-relaxed text-xs font-semibold">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
