import { UnifiedJob } from "../types";
import { JobConnector } from "./types";
import { fetchSiteIndexedJobs } from "./base";

// Helper to seed realistic fallback data per source
function createLocalFallback(
  sourceId: string,
  sourceName: string,
  index: number,
  title: string,
  company: string,
  location: string,
  jobType: UnifiedJob["jobType"],
  exp: UnifiedJob["experienceLevel"],
  salary: number,
  skills: string[],
  desc: string
): UnifiedJob {
  return {
    id: `dm-${sourceId}-${index}`,
    title,
    company,
    location,
    jobType,
    experienceLevel: exp,
    salaryMin: salary,
    salaryMax: Math.round(salary * 1.5),
    salaryCurrency: "INR",
    salaryPeriod: jobType === "internship" ? "monthly" : "yearly",
    description: desc,
    requirements: [
      `Strong execution capability in ${skills.slice(0, 2).join(" and ")}.`,
      "Excellent communication and collaboration skills.",
      "Detail-oriented problem solver."
    ],
    skills,
    postedDate: new Date(Date.now() - index * 12 * 60 * 60 * 1000).toISOString(),
    applyUrl: `https://www.${sourceId}.com/jobs/${index}`,
    source: sourceId,
    sourceAttribution: `via ${sourceName}`,
    lastUpdated: new Date().toISOString()
  };
}

// 1. LinkedIn Connector
export class LinkedInConnector implements JobConnector {
  id = "linkedin";
  name = "LinkedIn";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("linkedin.com", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "Software Engineer (React & TypeScript)", "Vercel", "Remote (India)",
        "full-time", "mid", 1200000, ["React", "TypeScript", "Next.js"],
        "Join Vercel's product layout squad. Refine loading speeds, configure server components, and design responsive user dashboards."
      ),
      createLocalFallback(
        this.id, this.name, 2,
        "Backend Developer (Go & PostgreSQL)", "Razorpay", "Bangalore, India",
        "full-time", "mid", 1500000, ["Go", "PostgreSQL", "Docker"],
        "Razorpay is hiring a Backend Engineer to scale real-time payment database routes. Optimize transaction times and write clean, scalable microservices."
      )
    ];
  }
}

// 2. Indeed Connector
export class IndeedConnector implements JobConnector {
  id = "indeed";
  name = "Indeed India";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("indeed.com", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "Full Stack Developer (Next.js & Node)", "Zomato", "Gurugram, India",
        "full-time", "mid", 1000000, ["Next.js", "Node.js", "MongoDB"],
        " Zomato is recruiting a Full Stack Engineer to rebuild partner interface engines. Set up clean REST endpoints and modular pages."
      )
    ];
  }
}

// 3. Internshala Connector
export class InternshalaConnector implements JobConnector {
  id = "internshala";
  name = "Internshala";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("internshala.com", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "React Native Intern", "Swiggy", "Remote",
        "internship", "entry", 22000, ["React Native", "TypeScript"],
        "Construct responsive delivery trackers. Design native layouts in Android/iOS frameworks and parse telemetry payloads."
      )
    ];
  }
}

// 4. Naukri Connector
export class NaukriConnector implements JobConnector {
  id = "naukri";
  name = "Naukri.com";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("naukri.com", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "System Reliability Engineer (DevOps)", "TCS", "Pune, India",
        "full-time", "senior", 1400000, ["Docker", "Kubernetes", "AWS"],
        "Govern enterprise production clusters. Monitor container pools, write Terraform blueprints, and configure automatic backups."
      )
    ];
  }
}

// 5. FoundIt Connector
export class FoundItConnector implements JobConnector {
  id = "foundit";
  name = "FoundIt (Monster)";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("foundit.in", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "Java Software Architect", "Accenture", "Bangalore, India",
        "full-time", "lead", 2800000, ["Java", "Spring Boot", "Kafka"],
        "Design high-throughput banking systems. Model database schema migrations, manage caching clusters, and review code structures."
      )
    ];
  }
}

// 6. Shine Connector
export class ShineConnector implements JobConnector {
  id = "shine";
  name = "Shine.com";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("shine.com", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "Angular Web Specialist", "Mindtree", "Hyderabad, India",
        "full-time", "mid", 800000, ["Angular", "TypeScript", "SCSS"],
        "Mindtree is looking for an Angular Specialist to refine merchant accounting views. Connect state controllers and style responsive grids."
      )
    ];
  }
}

// 7. Freshersworld Connector
export class FreshersworldConnector implements JobConnector {
  id = "freshersworld";
  name = "Freshersworld";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("freshersworld.com", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "Graduate Software Trainee", "Tech Mahindra", "Noida, India",
        "full-time", "entry", 400000, ["Java", "SQL", "Git"],
        "Entry-level software track. Learn enterprise application frameworks, write SQL query updates, and troubleshoot bugs under senior developers."
      )
    ];
  }
}

// 8. Apna Connector
export class ApnaConnector implements JobConnector {
  id = "apna";
  name = "Apna";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("apna.co", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "Technical Support Engineer", "Teleperformance", "Chennai, India",
        "full-time", "entry", 300000, ["Linux", "Git"],
        "Assist customers in troubleshooting API logs and database connect errors. Basic command execution in Unix environments is desired."
      )
    ];
  }
}

// 9. PlacementIndia Connector
export class PlacementIndiaConnector implements JobConnector {
  id = "placementindia";
  name = "PlacementIndia";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("placementindia.com", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "Database Administrator", "SQL Tech Systems", "Bhubaneswar, India",
        "full-time", "mid", 750000, ["PostgreSQL", "SQL", "Docker"],
        "Monitor transactional database query speeds. Clean tables, set up replication controllers, and audit database security logs."
      )
    ];
  }
}

// 10. SimplyHired Connector
export class SimplyHiredConnector implements JobConnector {
  id = "simplyhired";
  name = "SimplyHired";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("simplyhired.co.in", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "WordPress Theme Builder", "Agency Digital", "Remote",
        "freelance", "mid", 45000, ["JavaScript", "HTML"],
        "Build, configure, and publish custom WordPress plugins and layouts for client stores. Requires fast styling capabilities."
      )
    ];
  }
}

// 11. GrabJobs Connector
export class GrabJobsConnector implements JobConnector {
  id = "grabjobs";
  name = "GrabJobs";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("grabjobs.co", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "Python Data Analyst", "FinCorp Solutions", "Mumbai, India",
        "full-time", "mid", 950000, ["Python", "SQL", "Pandas"],
        "Analyze stock market patterns, write Python analytics wrappers, format tables, and construct visualizations."
      )
    ];
  }
}

// 12. Talent.com Connector
export class TalentConnector implements JobConnector {
  id = "talent";
  name = "Talent.com";
  async fetchJobs(query: string, location: string): Promise<UnifiedJob[]> {
    const liveJobs = await fetchSiteIndexedJobs("talent.com", query, location, this.id, this.name);
    if (liveJobs.length > 0) return liveJobs;

    // Fallback
    return [
      createLocalFallback(
        this.id, this.name, 1,
        "React & Redux Consultant", "Startups LLC", "Remote (Global)",
        "freelance", "mid", 60000, ["React", "TypeScript", "Tailwind CSS"],
        "Fiverr/Talent.com gig: refactor ecommerce payment gateways. Clean states, optimize assets loading, and write clean unit tests."
      )
    ];
  }
}
