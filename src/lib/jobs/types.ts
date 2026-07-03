export interface UnifiedJob {
  id: string;                    // unique hash slug
  title: string;
  company: string;
  companyLogo?: string;
  location: string;              // "Remote", "Bangalore, India", etc.
  jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance";
  experienceLevel: "entry" | "mid" | "senior" | "lead" | "executive";
  salaryMin?: number;            // In INR or USD
  salaryMax?: number;
  salaryCurrency: string;
  salaryPeriod: "yearly" | "monthly" | "hourly";
  description: string;           // Full text description
  requirements: string[];        // Requirements bullet points
  skills: string[];              // Tech stack: ["React", "Node.js"]
  postedDate: string;            // ISO 8601
  applyUrl: string;              // Original application link
  source: string;                // "linkedin", "indeed", "internshala", "naukri", etc.
  sourceAttribution: string;     // e.g. "via LinkedIn"
  matchScore?: number;           // computed score
  alternateUrls?: string[];      // duplicated postings apply URLs
  alternateSources?: string[];   // duplicated postings source attributions
  lastUpdated?: string;          // sync updated timestamp
  expiryDate?: string;           // job closed timestamp
  sourceJobId?: string;          // original source system ID
  category?: string;             // e.g. "Software Development", "Design"
}

export interface JobSearchFilters {
  query?: string;
  location?: string;
  jobType?: UnifiedJob["jobType"][];
  experienceLevel?: UnifiedJob["experienceLevel"][];
  skills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  remoteOnly?: boolean;
  postedWithin?: "24h" | "7d" | "30d" | "all";
}

export interface JobSearchResult {
  jobs: UnifiedJob[];
  totalResults: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  sourceBreakdown: Record<string, number>; // {"adzuna": 45, "loopcv": 23}
  cached: boolean;
  fetchedAt: string;
}
