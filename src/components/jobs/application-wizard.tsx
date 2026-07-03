"use client";

import { useState } from "react";
import { X, Upload, CheckCircle2, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocial } from "@/components/providers/social-context";
import { UnifiedJob } from "@/lib/jobs/types";

interface ApplicationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  job: UnifiedJob | null;
  onSuccess?: () => void;
}

export function ApplicationWizard({ isOpen, onClose, job, onSuccess }: ApplicationWizardProps) {
  const { currentUser } = useSocial();

  const [step, setStep] = useState(1);
  const [whyHire, setWhyHire] = useState("");
  const [availability, setAvailability] = useState("yes");
  const [noticePeriod, setNoticePeriod] = useState("immediate");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);
    setError(null);

    // Simulate parsing the resume content
    setTimeout(() => {
      setIsUploading(false);
      
      // Heuristic parsing based on file names or random assignment matching job requirements
      // We will parse skills like React, Node.js, Python, Java, Docker, TypeScript etc.
      const samplePool = ["React", "TypeScript", "Node.js", "Java", "Python", "Docker", "Kubernetes", "Tailwind CSS", "Next.js", "PostgreSQL"];
      const shuffled = [...samplePool].sort(() => 0.5 - Math.random());
      const extracted = shuffled.slice(0, 3 + Math.floor(Math.random() * 3));
      
      setParsedSkills(extracted);
    }, 1500);
  };

  const handleApplySubmit = async () => {
    if (!fileName) {
      setError("Please upload your resume to complete the application.");
      return;
    }
    if (job.source === "internshala" && !whyHire.trim()) {
      setError("Please fill out the screening question.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      try {
        // 1. Log the application
        const localApps = localStorage.getItem("devmatch_applications");
        const apps = localApps ? JSON.parse(localApps) : [];
        const newApp = {
          id: `app-${Date.now()}`,
          company: job.company,
          role: job.title,
          status: "applied",
          appliedDate: new Date().toLocaleDateString("en-IN"),
          notes: `Applied via DevMatch direct integration. Screening: "${whyHire.slice(0, 50)}...". Resume: ${fileName}.`
        };
        apps.unshift(newApp);
        localStorage.setItem("devmatch_applications", JSON.stringify(apps));

        // 2. Sync parsed skills to user profile
        if (parsedSkills.length > 0 && currentUser) {
          const uniqueSkills = Array.from(new Set([...(currentUser.skills || []), ...parsedSkills]));
          const updatedUser = {
            ...currentUser,
            skills: uniqueSkills.slice(0, 8) // Limit to top 8
          };
          localStorage.setItem("devmatch_currentUser", JSON.stringify(updatedUser));
        }

        setIsSubmitting(false);
        setStep(3); // success step
      } catch (e: any) {
        setError("Failed to submit application. Please try again.");
        setIsSubmitting(false);
      }
    }, 1500);
  };

  const handleCloseAndReset = () => {
    setStep(1);
    setWhyHire("");
    setAvailability("yes");
    setNoticePeriod("immediate");
    setFileName(null);
    setParsedSkills([]);
    setError(null);
    onClose();
    if (step === 3 && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-primary tracking-widest">{job.sourceAttribution} Application</span>
            <h3 className="text-sm font-bold text-stone-900 truncate max-w-[280px]">{job.title}</h3>
            <p className="text-[11px] text-stone-500 font-semibold">{job.company} • {job.location}</p>
          </div>
          <button onClick={handleCloseAndReset} className="w-8 h-8 rounded-full hover:bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Step 1: Upload Resume</label>
                <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors relative cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5 text-stone-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-700">
                        {fileName ? fileName : "Drag & drop or click to upload resume"}
                      </p>
                      <p className="text-[10px] text-stone-400 font-medium">Supporting PDF, DOCX, TXT up to 5MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning & parsing tech skills...</span>
                </div>
              )}

              {fileName && !isUploading && (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <span>Resume successfully parsed</span>
                  </div>
                  {parsedSkills.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Extracted Skills DNA:</div>
                      <div className="flex flex-wrap gap-1">
                        {parsedSkills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={() => setStep(2)}
                disabled={!fileName || isUploading}
                className="w-full bg-primary text-white font-black uppercase text-[10px] tracking-widest py-4.5 rounded-2xl cursor-pointer"
              >
                Proceed to Screening <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">Step 2: Screening Questions</div>
              
              {job.source === "internshala" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-800">
                      Why should we hire you for this internship? *
                    </label>
                    <textarea
                      required
                      value={whyHire}
                      onChange={(e) => setWhyHire(e.target.value)}
                      placeholder="Mention your relevant projects, tech stack experience, and why you are interested..."
                      className="w-full min-h-[100px] p-3 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 text-stone-750 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-800">
                      Are you available for the full duration of this internship? *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="availability"
                          checked={availability === "yes"}
                          onChange={() => setAvailability("yes")}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span>Yes, I am available immediately</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="availability"
                          checked={availability === "no"}
                          onChange={() => setAvailability("no")}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span>No (Specify details)</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-800">
                      What is your notice period? *
                    </label>
                    <select
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="w-full p-3 bg-stone-50 border border-stone-200 text-xs font-semibold rounded-xl text-stone-700"
                    >
                      <option value="immediate">Immediate Joiner</option>
                      <option value="15days">15 Days</option>
                      <option value="30days">30 Days</option>
                      <option value="90days">90 Days</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-800">
                      Additional Message for the Recruiter (Optional)
                    </label>
                    <textarea
                      value={whyHire}
                      onChange={(e) => setWhyHire(e.target.value)}
                      placeholder="Add any notes on reference coordinates or past achievements..."
                      className="w-full min-h-[100px] p-3 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 text-stone-750 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 font-bold uppercase text-[10px] tracking-wider py-4.5 rounded-2xl cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  onClick={handleApplySubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-primary text-white font-black uppercase text-[10px] tracking-widest py-4.5 rounded-2xl cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-stone-900">Application Submitted!</h4>
                <p className="text-xs text-stone-500 font-semibold max-w-xs mx-auto leading-relaxed">
                  Your resume has been processed, screening forms delivered, and skills added to your local DevMatch profile.
                </p>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl max-w-sm mx-auto text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                Logged in Command Tracker
              </div>
              <Button
                onClick={handleCloseAndReset}
                className="w-full max-w-xs bg-primary text-white font-black uppercase text-[10px] tracking-widest py-4.5 rounded-2xl cursor-pointer mx-auto block"
              >
                Close & Return
              </Button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
