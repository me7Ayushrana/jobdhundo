"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocial } from "@/components/providers/social-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Sparkles, LogIn } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loginWithGoogle, loginAsGuest, isFirebaseConfigured } = useSocial();
  const [activeTab, setActiveTab] = useState<"google" | "guest">("google");
  
  // Guest state
  const [guestName, setGuestName] = useState("");
  const [guestRole, setGuestRole] = useState("Frontend");
  const [guestGithub, setGuestGithub] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Authentication failed. Please try guest mode.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError("Please enter a name.");
      return;
    }
    setIsSubmitting(true);
    try {
      loginAsGuest(
        guestName.trim(),
        guestRole,
        guestGithub.trim() || undefined
      );
      onClose();
    } catch (err: any) {
      setError("Failed to initialize guest profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-md bg-stone-50 border border-stone-200/80 rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-200/50 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="space-y-6">
              <header className="space-y-2">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-primary">
                  Authentication Gateway
                </div>
                <h2 className="text-3xl font-black tracking-tight text-stone-900 leading-none">
                  Access DevMatch
                </h2>
                <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                  Join the elite network of developers matching for hackathons and building the future.
                </p>
              </header>

              {/* Tabs */}
              <div className="flex border-b border-stone-200">
                <button
                  onClick={() => setActiveTab("google")}
                  className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                    activeTab === "google"
                      ? "border-primary text-stone-900"
                      : "border-transparent text-stone-400 hover:text-stone-600"
                  }`}
                >
                  Google Account
                </button>
                <button
                  onClick={() => setActiveTab("guest")}
                  className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                    activeTab === "guest"
                      ? "border-primary text-stone-900"
                      : "border-transparent text-stone-400 hover:text-stone-600"
                  }`}
                >
                  Guest Access
                </button>
              </div>

              {error && (
                <div className="p-3 text-xs font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-center">
                  {error}
                </div>
              )}

              {/* Tab Content */}
              {activeTab === "google" ? (
                <div className="space-y-6 py-2">
                  {!isFirebaseConfigured && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                      Notice: Firebase is not configured in this environment. Google Login is disabled. Please use Guest Access.
                    </div>
                  )}
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting || !isFirebaseConfigured}
                    className="w-full h-14 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.41-4.91 3.41-8.69z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.24 14.29c-.23-.69-.36-1.42-.36-2.19 0-.77.13-1.5.36-2.19L1.39 6.92C.5 8.7 0 10.7 0 12.8s.5 4.1 1.39 5.88l3.85-2.99z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.34 1.1-4.26 1.1-3.34 0-5.86-1.81-6.76-4.51L1.39 16.8c1.98 3.89 5.96 6.56 10.61 6.56z"
                      />
                    </svg>
                    Sign In with Google
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleGuestLogin} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                      Display Name
                    </label>
                    <Input
                      placeholder="e.g. Ayush Rana"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="h-12 bg-white border border-stone-200 text-stone-900 rounded-xl px-4 font-semibold focus-visible:ring-primary focus-visible:ring-1"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                      Primary Role
                    </label>
                    <select
                      value={guestRole}
                      onChange={(e) => setGuestRole(e.target.value)}
                      className="w-full h-12 bg-white border border-stone-200 text-stone-900 rounded-xl px-4 font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                      disabled={isSubmitting}
                    >
                      <option value="Frontend">Frontend Developer</option>
                      <option value="Backend">Backend Developer</option>
                      <option value="Designer">UI/UX Designer</option>
                      <option value="Fullstack">Full-Stack Developer</option>
                      <option value="Product">Product Manager</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                      GitHub Username (Optional)
                    </label>
                    <Input
                      placeholder="e.g. ayushrana"
                      value={guestGithub}
                      onChange={(e) => setGuestGithub(e.target.value)}
                      className="h-12 bg-white border border-stone-200 text-stone-900 rounded-xl px-4 font-semibold focus-visible:ring-primary focus-visible:ring-1"
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-primary hover:bg-stone-900 text-white text-xs font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    Enter as Guest
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
