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
              Naukri & Internshala.<br />
              <span className="text-primary">All In One Portal.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-stone-500 text-sm md:text-base leading-relaxed font-semibold max-w-xl"
            >
              Access internships from Internshala and full-time software engineering roles from Naukri.com. Upload your resume, parse skills automatically, and submit screenings directly.
            </motion.p>

            {/* Clean Professional Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-xl"
            >
              <form onSubmit={handleSearchSubmit} className="p-2 bg-white border border-stone-200 rounded-3xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-sm focus-within:border-primary transition-all duration-300">
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

            {/* Quick Filter Chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-2 max-w-xl"
            >
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mr-1">Hot Keys:</span>
              
              <Badge
                onClick={() => handleChipClick("remote", "Remote")}
                className="cursor-pointer bg-white border border-stone-200 hover:border-primary text-stone-600 font-bold px-3 py-1.5 rounded-full text-xs shadow-sm"
              >
                🏠 Remote
              </Badge>
              
              <Badge
                onClick={() => handleChipClick("skill", "React")}
                className="cursor-pointer bg-white border border-stone-200 hover:border-primary text-stone-600 font-bold px-3 py-1.5 rounded-full text-xs shadow-sm"
              >
                ⚛️ React
              </Badge>
              
              <Badge
                onClick={() => handleChipClick("skill", "Java")}
                className="cursor-pointer bg-white border border-stone-200 hover:border-primary text-stone-600 font-bold px-3 py-1.5 rounded-full text-xs shadow-sm"
              >
                ☕ Java
              </Badge>
              
              <Badge
                onClick={() => handleChipClick("location", "Bangalore")}
                className="cursor-pointer bg-white border border-stone-200 hover:border-primary text-stone-600 font-bold px-3 py-1.5 rounded-full text-xs shadow-sm"
              >
                📍 Bangalore
              </Badge>
            </motion.div>
          </div>

          {/* Right Column: High-End Vector Illustration */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-3 bg-white border border-stone-200 rounded-[2.5rem] shadow-sm max-w-md overflow-hidden relative"
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

        {/* Live Index Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full border-t border-stone-200 pt-10 mt-16"
        >
          {/* Index counter */}
          <div className="flex flex-col items-start justify-center space-y-1">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Aggregated Portals Index</span>
            <div className="text-3xl font-black text-stone-900 tracking-tight flex items-baseline gap-1.5">
              <span>34,912</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Active Openings</span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              Consolidated, cleaned, and synced from Naukri, Internshala, Adzuna, and LoopCV pipelines.
            </p>
          </div>

          {/* Trending Searches */}
          <div className="flex flex-col items-start justify-center space-y-2">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Trending Keywords
            </span>
            <div className="flex flex-col gap-1.5 w-full">
              {[
                { term: "Web Development Internship (Internshala)", link: "/jobs?q=Web Development" },
                { term: "Senior Frontend Engineer (Naukri)", link: "/jobs?q=Frontend" },
                { term: "DevOps Infrastructure (Naukri)", link: "/jobs?q=DevOps" }
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href={item.link}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200 hover:border-primary/50 text-xs font-bold text-stone-700 shadow-sm transition-colors"
                >
                  <span>{item.term}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

      </section>

      {/* Corporate Professional features */}
      <section className="py-20 border-t border-stone-200 bg-white/50 z-10 relative">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Briefcase, title: "Naukri & Internshala Feeds", desc: "View software engineering vacancies and internships unified into a single schema. Access details, eligibility, and descriptions on one dashboard." },
              { icon: Code, title: "Direct Screening Submittals", desc: "Apply directly by uploading your resume, parsing skills, and filling out custom company screening forms inside the workspace." },
              { icon: ShieldCheck, title: "Skills Alignment Scorer", desc: "Upload your CV to automatically map keywords and experience. The matcher rates every opportunity based on your actual tech stack usage." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-stone-200 p-8 rounded-3xl flex flex-col items-start gap-4 shadow-sm hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center border border-stone-200 shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-stone-900 mb-1.5">{feature.title}</h3>
                  <p className="text-stone-500 leading-relaxed text-xs font-semibold">
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
