import { UnifiedJob } from "../types";

export function cleanHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\/?[^>]+(>|$)/g, "") // remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const COMMON_SKILLS = [
  "React", "Node.js", "TypeScript", "JavaScript", "Python", "Java", "C++", "C#",
  "Go", "Rust", "Swift", "Kotlin", "Ruby", "PHP", "Scala", "AWS", "Azure",
  "Docker", "Kubernetes", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Firebase",
  "Git", "GraphQL", "REST API", "Framer Motion", "Three.js", "Figma", "Tailwind CSS",
  "Next.js", "Django", "Flask", "Spring Boot", "Angular", "Vue.js", "Svelte",
  "DevOps", "CI/CD", "Terraform", "Prisma", "Drizzle", "Express", "FastAPI"
];

export function extractSkills(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const found = new Set<string>();
  
  for (const skill of COMMON_SKILLS) {
    const sLower = skill.toLowerCase();
    
    // Exact word boundary matching for skills
    let regex;
    if (sLower === "c++" || sLower === "c#") {
      // Escape special characters
      regex = new RegExp(sLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    } else if (sLower === "node.js" || sLower === "next.js" || sLower === "vue.js") {
      regex = new RegExp(`\\b${sLower.replace('.', '\\.')}\\b|\\b${sLower.replace('.js', '')}\\b`, 'i');
    } else {
      regex = new RegExp(`\\b${sLower}\\b`, 'i');
    }
    
    if (regex.test(text)) {
      found.add(skill);
    }
  }
  
  return Array.from(found);
}

export function normalizeExperience(title: string, description: string): UnifiedJob["experienceLevel"] {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("lead") || text.includes("principal") || text.includes("head of") || text.includes("manager")) return "lead";
  if (text.includes("executive") || text.includes("vp") || text.includes("cto") || text.includes("director")) return "executive";
  if (text.includes("senior") || text.includes("sr.") || text.includes("sr ")) return "senior";
  if (text.includes("junior") || text.includes("jr.") || text.includes("entry") || text.includes("associate") || text.includes("intern") || text.includes("fresher")) return "entry";
  return "mid";
}

export function normalizeJobType(typeStr: any): UnifiedJob["jobType"] {
  let val = "";
  if (typeof typeStr === "string") {
    val = typeStr;
  } else if (Array.isArray(typeStr)) {
    val = typeStr.join(" ");
  } else if (typeStr) {
    val = String(typeStr);
  }
  const t = val.toLowerCase().trim();
  if (t.includes("parttime") || t.includes("part-time")) return "part-time";
  if (t.includes("contract") || t.includes("temp") || t.includes("temporary")) return "contract";
  if (t.includes("intern") || t.includes("co-op")) return "internship";
  if (t.includes("freelance") || t.includes("gig")) return "freelance";
  return "full-time";
}

export function detectOriginalSource(url: string, publisher?: string): string {
  if (publisher && !["adzuna", "loopcv", "jsearch", "cached"].includes(publisher.toLowerCase())) {
    return publisher;
  }
  if (!url) return "Job Board";
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    if (domain.includes("linkedin")) return "LinkedIn";
    if (domain.includes("indeed")) return "Indeed";
    if (domain.includes("glassdoor")) return "Glassdoor";
    if (domain.includes("naukri")) return "Naukri.com";
    if (domain.includes("internshala")) return "Internshala";
    if (domain.includes("unstop")) return "Unstop";
    if (domain.includes("wellfound") || domain.includes("angel.co")) return "Wellfound";
    if (domain.includes("upwork")) return "Upwork";
    if (domain.includes("fiverr")) return "Fiverr";
    if (domain.includes("foundit") || domain.includes("monster")) return "Foundit";
    if (domain.includes("shine")) return "Shine.com";
    if (domain.includes("freshersworld")) return "Freshersworld";
    if (domain.includes("apna")) return "Apna";
    if (domain.includes("workindia")) return "WorkIndia";
    if (domain.includes("mygov")) return "MyGov";
    if (domain.includes("aicte")) return "AICTE Portal";
    
    const parts = domain.split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch (_) {
    return publisher || "Job Board";
  }
}

export function normalizeJobs(rawJobs: any[], source: UnifiedJob["source"]): UnifiedJob[] {
  if (!rawJobs || !Array.isArray(rawJobs)) return [];

  return rawJobs.map((item, idx) => {
    let id = `dm-${source}-${item.id || item.job_id || idx}-${Date.now()}`;
    let title = "";
    let company = "";
    let companyLogo = undefined;
    let location = "Remote";
    let jobType: UnifiedJob["jobType"] = "full-time";
    let experienceLevel: UnifiedJob["experienceLevel"] = "mid";
    let salaryMin = undefined;
    let salaryMax = undefined;
    let salaryCurrency: UnifiedJob["salaryCurrency"] = "USD";
    let salaryPeriod: UnifiedJob["salaryPeriod"] = "yearly";
    let description = "";
    let requirements: string[] = [];
    let skills: string[] = [];
    let postedDate = new Date().toISOString();
    let applyUrl = "";

    if (source === "adzuna") {
      title = item.title || "";
      company = item.company?.display_name || "Unknown Company";
      location = item.location?.display_name || "India";
      
      const isPart = item.contract_time === "part_time";
      const isContract = item.contract_type === "contract";
      jobType = isPart ? "part-time" : isContract ? "contract" : "full-time";
      
      salaryMin = item.salary_min;
      salaryMax = item.salary_max;
      salaryCurrency = "INR"; // India default for Adzuna
      salaryPeriod = "yearly";
      description = cleanHtml(item.description || "");
      
      // Auto requirements
      if (item.description) {
        requirements = item.description.split('.').map((s: string) => s.trim()).filter((s: string) => s.length > 10).slice(0, 4);
      }
      
      postedDate = item.created ? new Date(item.created).toISOString() : new Date().toISOString();
      applyUrl = item.redirect_url || "";
      skills = extractSkills(title, description);
      experienceLevel = normalizeExperience(title, description);

    } else if (source === "loopcv") {
      title = item.job_title || item.title || "";
      company = item.company_name || item.company || "Unknown Company";
      location = item.location || "Remote";
      jobType = normalizeJobType(item.job_type || "");
      
      salaryMin = item.salary_min;
      salaryMax = item.salary_max;
      salaryCurrency = item.currency || "USD";
      salaryPeriod = item.salary_period || "yearly";
      description = cleanHtml(item.job_description || item.description || "");
      
      if (description) {
        requirements = description.split('.').map((s: string) => s.trim()).filter((s: string) => s.length > 10).slice(0, 4);
      }
      
      postedDate = item.date_posted || item.posted_date || new Date().toISOString();
      applyUrl = item.apply_url || item.url || "";
      skills = extractSkills(title, description);
      experienceLevel = normalizeExperience(title, description);

    } else if (source === "jsearch") {
      title = item.job_title || "";
      company = item.employer_name || "Unknown Company";
      companyLogo = item.employer_logo || undefined;
      location = item.job_is_remote ? "Remote" : [item.job_city, item.job_state, item.job_country].filter(Boolean).join(", ") || "United States";
      jobType = normalizeJobType(item.job_employment_type || "");
      
      salaryMin = item.job_min_salary;
      salaryMax = item.job_max_salary;
      salaryCurrency = (item.job_salary_currency as any) || "USD";
      salaryPeriod = (item.job_salary_period?.toLowerCase() === "month" ? "monthly" : item.job_salary_period?.toLowerCase() === "hour" ? "hourly" : "yearly") as any;
      description = cleanHtml(item.job_description || "");
      
      if (item.job_highlights?.Qualifications) {
        requirements = item.job_highlights.Qualifications;
      } else {
        requirements = description.split('.').map((s: string) => s.trim()).filter((s: string) => s.length > 15).slice(0, 4);
      }
      
      postedDate = item.job_posted_at_timestamp ? new Date(item.job_posted_at_timestamp * 1000).toISOString() : new Date().toISOString();
      applyUrl = item.job_apply_link || "";
      
      if (item.job_required_skills) {
        skills = item.job_required_skills;
      } else {
        skills = extractSkills(title, description);
      }
      experienceLevel = normalizeExperience(title, description);
    } else {
      id = item.id || id;
      title = item.title || "";
      company = item.company || "";
      companyLogo = item.companyLogo;
      location = item.location || "";
      jobType = item.jobType || "full-time";
      experienceLevel = item.experienceLevel || "mid";
      salaryMin = item.salaryMin;
      salaryMax = item.salaryMax;
      salaryCurrency = item.salaryCurrency || "USD";
      salaryPeriod = item.salaryPeriod || "yearly";
      description = item.description || "";
      requirements = item.requirements || [];
      skills = item.skills || [];
      postedDate = item.postedDate || postedDate;
      applyUrl = item.applyUrl || "";
    }

    return {
      id,
      title,
      company,
      companyLogo,
      location,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryPeriod,
      description,
      requirements,
      skills,
      postedDate,
      applyUrl,
      source,
      sourceAttribution: `via ${detectOriginalSource(applyUrl, item.job_publisher || item.publisher || item.source_name || item.job_source || (source === "cached" ? "Curated" : source))}`
    };
  });
}
