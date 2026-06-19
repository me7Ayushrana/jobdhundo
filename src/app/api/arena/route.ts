import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

// ── Types ──────────────────────────────────────────────────────────
export interface ArenaHackathon {
    id: string;
    title: string;
    organizer: string;
    daysLeft: number | null;
    participants: number;
    imageUrl: string;
    unstopUrl: string;
    tags: string[];
    prize?: string; // for hackathons
    stipend?: string; // for internships
    salary?: string; // for jobs
    opportunityType: "hackathon" | "internship" | "job";
    teamFitScore: number;
    suggestedRoles: string[];
    location: string;
}

interface CacheEntry {
    data: ArenaHackathon[];
    timestamp: number;
}

// Cache TTL: 10 minutes
const CACHE_TTL = 10 * 60 * 1000;
let cacheMap: Record<string, CacheEntry> = {};

// ── Role Mapping ───────────────────────────────────────────────────
const TAG_ROLE_MAP: Record<string, string[]> = {
    "ai": ["ML Engineer", "Data Scientist"],
    "ml": ["ML Engineer", "Data Scientist"],
    "machine learning": ["ML Engineer", "Data Scientist"],
    "deep learning": ["ML Engineer", "AI Researcher"],
    "web": ["Frontend Dev", "Full-Stack Dev"],
    "frontend": ["Frontend Dev", "UI/UX Designer"],
    "backend": ["Backend Dev", "DevOps Engineer"],
    "blockchain": ["Smart Contract Dev", "Web3 Engineer"],
    "web3": ["Web3 Engineer", "Smart Contract Dev"],
    "mobile": ["Mobile Dev", "React Native Dev"],
    "iot": ["IoT Engineer", "Embedded Dev"],
    "cloud": ["Cloud Architect", "DevOps Engineer"],
    "cybersecurity": ["Security Analyst", "Pen Tester"],
    "data": ["Data Engineer", "Data Analyst"],
    "design": ["UI/UX Designer", "Product Designer"],
    "game": ["Game Dev", "Unity Developer"],
    "ar": ["AR/VR Dev", "3D Artist"],
    "vr": ["AR/VR Dev", "3D Artist"],
    "sustainability": ["Green Tech Dev", "Full-Stack Dev"],
    "fintech": ["Backend Dev", "Full-Stack Dev"],
    "healthtech": ["Full-Stack Dev", "Data Scientist"],
    "edtech": ["Full-Stack Dev", "Frontend Dev"],
};

function deriveRoles(tags: string[]): string[] {
    const roles = new Set<string>();
    for (const tag of tags) {
        const lower = tag.toLowerCase();
        for (const [keyword, mapped] of Object.entries(TAG_ROLE_MAP)) {
            if (lower.includes(keyword)) {
                mapped.forEach((r) => roles.add(r));
            }
        }
    }
    if (roles.size === 0) roles.add("Full-Stack Dev");
    return Array.from(roles).slice(0, 3);
}

function computeTeamFitScore(tags: string[]): number {
    const base = 40;
    const tagBonus = Math.min(tags.length * 8, 30);
    const jitter = Math.floor(Math.random() * 20);
    return Math.min(base + tagBonus + jitter, 98);
}

function parseDaysLeft(text: string): number | null {
    const match = text.match(/(\d+)\s*days?\s*left/i);
    if (match) return parseInt(match[1], 10);
    if (/today|ends today/i.test(text)) return 0;
    if (/tomorrow/i.test(text)) return 1;
    return null;
}

// ── Scraper ────────────────────────────────────────────────────────
async function scrapeUnstop(oppType: "hackathons" | "internships" | "jobs"): Promise<ArenaHackathon[]> {
    const apiType = oppType === "hackathons" ? "competitions" : oppType;
    const url = `https://unstop.com/api/public/opportunity/search-new?opportunity=${apiType}&filters=,All,Open,All&types=teamsize,payment,oppstatus,eligible&atype=explore&showOlderResultForSearch=true&page=1`;

    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": `https://unstop.com/${oppType}`,
        }
    });

    if (!res.ok) {
        throw new Error(`Unstop API returned status ${res.status}`);
    }

    const payload = await res.json();
    const items = payload?.data?.data;
    if (!items || !Array.isArray(items)) {
        return [];
    }

    const typeSingular = oppType === "hackathons" ? "hackathon" : oppType === "internships" ? "internship" : "job";
    const opportunities: ArenaHackathon[] = [];

    items.forEach((item: any, i: number) => {
        if (i >= 12) return;

        const title = item.title || "Opportunity";
        const organizer = item.organisation?.name || "Unstop";
        
        let daysLeft: number | null = null;
        if (item.regnRequirements?.remainingDaysArray?.durations !== undefined) {
            daysLeft = Number(item.regnRequirements.remainingDaysArray.durations);
        } else if (item.regnRequirements?.remain_days) {
            daysLeft = parseDaysLeft(item.regnRequirements.remain_days);
        }

        const participants = item.registerCount || item.viewsCount || Math.floor(Math.random() * 800 + 200);
        
        const imageUrl = item.banner_mobile?.image_url || item.logoUrl2 || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop";
        const unstopUrl = item.seo_url || item.short_url || `https://unstop.com/o/${item.short_id}`;

        const tags: string[] = [];
        if (item.tags && Array.isArray(item.tags)) {
            tags.push(...item.tags);
        }
        if (item.required_skills && Array.isArray(item.required_skills)) {
            item.required_skills.forEach((s: any) => {
                if (s.skill) tags.push(s.skill);
            });
        }
        let cleanTags = Array.from(new Set(tags.map(t => t.trim()))).filter(t => t.length > 0);
        if (cleanTags.length === 0) {
            cleanTags.push(typeSingular === "hackathon" ? "Open Innovation" : "Software Eng");
        }

        let prizeText = undefined;
        let stipendText = undefined;
        let salaryText = undefined;

        if (typeSingular === "hackathon") {
            if (item.prizes && item.prizes.length > 0) {
                const firstPrize = item.prizes.find((p: any) => p.cash) || item.prizes[0];
                if (firstPrize.cash) {
                    prizeText = `${firstPrize.currency === "fa-rupee" ? "₹" : "$"}${firstPrize.cash}`;
                } else if (firstPrize.others) {
                    prizeText = firstPrize.others;
                }
            }
            if (!prizeText) {
                prizeText = "Prizes Available";
            }
        } else if (typeSingular === "internship") {
            if (item.jobDetail) {
                const detail = item.jobDetail;
                if (detail.paid_unpaid === "unpaid") {
                    stipendText = "Unpaid";
                } else if (detail.min_salary || detail.max_salary) {
                    const sym = detail.currency === "fa-rupee" ? "₹" : "$";
                    const amount = detail.max_salary || detail.min_salary;
                    const period = detail.pay_in === "monthly" ? "month" : "year";
                    stipendText = `${sym}${amount.toLocaleString()} / ${period}`;
                }
            }
            if (!stipendText) {
                stipendText = item.isPaid ? "Paid" : "Unpaid";
            }
        } else {
            if (item.jobDetail) {
                const detail = item.jobDetail;
                if (detail.min_salary || detail.max_salary) {
                    const sym = detail.currency === "fa-rupee" ? "₹" : "$";
                    const amount = detail.max_salary || detail.min_salary;
                    const period = detail.pay_in === "monthly" ? "month" : "year";
                    salaryText = `${sym}${amount.toLocaleString()} / ${period}`;
                }
            }
            if (!salaryText) {
                salaryText = "Competitive";
            }
        }

        let location = "Remote";
        if (item.locations && item.locations.length > 0) {
            location = item.locations.map((loc: any) => typeof loc === "string" ? loc : loc.city || loc.state || loc.country).join(", ");
        } else if (item.jobDetail?.locations && item.jobDetail.locations.length > 0) {
            location = item.jobDetail.locations.join(", ");
        }

        opportunities.push({
            id: `unstop-${typeSingular}-${item.id || item.short_id || i}-${Date.now()}`,
            title: title.slice(0, 80),
            organizer: organizer.slice(0, 80),
            daysLeft,
            participants,
            imageUrl,
            unstopUrl,
            tags: cleanTags.slice(0, 3),
            prize: prizeText,
            stipend: stipendText,
            salary: salaryText,
            opportunityType: typeSingular,
            teamFitScore: computeTeamFitScore(cleanTags),
            suggestedRoles: deriveRoles(cleanTags),
            location,
        });
    });

    return opportunities;
}


// ── Fallback Data ──────────────────────────────────────────────────
const FALLBACK_HACKATHONS: ArenaHackathon[] = [
    {
        id: "fallback-hack-1",
        title: "Global AI Innovation Challenge 2026",
        organizer: "Google Developer Group",
        daysLeft: 12,
        participants: 2400,
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["AI/ML", "Cloud"],
        prize: "$50,000",
        opportunityType: "hackathon",
        teamFitScore: 92,
        suggestedRoles: ["ML Engineer", "Data Scientist", "Cloud Architect"],
        location: "Remote",
    },
    {
        id: "fallback-hack-2",
        title: "Web3 DeFi Builder Sprint",
        organizer: "Ethereum Foundation",
        daysLeft: 5,
        participants: 1100,
        imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["Blockchain", "Web Dev"],
        prize: "$30,000",
        opportunityType: "hackathon",
        teamFitScore: 78,
        suggestedRoles: ["Smart Contract Dev", "Web3 Engineer", "Frontend Dev"],
        location: "Bengaluru",
    },
    {
        id: "fallback-hack-3",
        title: "Sustain-a-Thon: Green Tech for Tomorrow",
        organizer: "UN Youth Initiative",
        daysLeft: 21,
        participants: 680,
        imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["Sustainability", "IoT"],
        prize: "$20,000",
        opportunityType: "hackathon",
        teamFitScore: 65,
        suggestedRoles: ["Green Tech Dev", "IoT Engineer", "Full-Stack Dev"],
        location: "Mumbai",
    },
    {
        id: "fallback-hack-4",
        title: "HealthTech Disrupt 2026",
        organizer: "WHO Digital Health",
        daysLeft: 8,
        participants: 950,
        imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["AI/ML", "Data Science"],
        prize: "$25,000",
        opportunityType: "hackathon",
        teamFitScore: 84,
        suggestedRoles: ["Full-Stack Dev", "Data Scientist", "ML Engineer"],
        location: "Delhi NCR",
    },
    {
        id: "fallback-hack-5",
        title: "NextGen Mobile App Challenge",
        organizer: "Apple Developer Academy",
        daysLeft: 15,
        participants: 1500,
        imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["Mobile", "Design"],
        prize: "$40,000",
        opportunityType: "hackathon",
        teamFitScore: 71,
        suggestedRoles: ["Mobile Dev", "UI/UX Designer", "React Native Dev"],
        location: "Pune",
    },
    {
        id: "fallback-hack-6",
        title: "CyberShield CTF & Build",
        organizer: "CloudFlare Security",
        daysLeft: 3,
        participants: 780,
        imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["Cloud", "Web Dev"],
        prize: "$15,000",
        opportunityType: "hackathon",
        teamFitScore: 56,
        suggestedRoles: ["Security Analyst", "DevOps Engineer", "Backend Dev"],
        location: "Remote",
    },
];

const FALLBACK_INTERNSHIPS: ArenaHackathon[] = [
    {
        id: "fallback-intern-1",
        title: "Front-End Engineer Intern",
        organizer: "Vercel Labs",
        daysLeft: 14,
        participants: 1200,
        imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/internships",
        tags: ["Web Dev", "Design"],
        stipend: "$1,500 / month",
        opportunityType: "internship",
        teamFitScore: 95,
        suggestedRoles: ["Frontend Dev", "UI/UX Designer", "Full-Stack Dev"],
        location: "Remote",
    },
    {
        id: "fallback-intern-2",
        title: "AI/ML Core Research Intern",
        organizer: "OpenAI",
        daysLeft: 9,
        participants: 3100,
        imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/internships",
        tags: ["AI/ML", "Data Science"],
        stipend: "$2,800 / month",
        opportunityType: "internship",
        teamFitScore: 89,
        suggestedRoles: ["ML Engineer", "AI Researcher", "Data Scientist"],
        location: "Remote",
    },
    {
        id: "fallback-intern-3",
        title: "Product UX Design Intern",
        organizer: "Airbnb Design",
        daysLeft: 20,
        participants: 540,
        imageUrl: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/internships",
        tags: ["Design"],
        stipend: "$1,800 / month",
        opportunityType: "internship",
        teamFitScore: 78,
        suggestedRoles: ["UI/UX Designer", "Product Designer"],
        location: "Bengaluru",
    },
    {
        id: "fallback-intern-4",
        title: "Backend Services Intern",
        organizer: "Razorpay Tech",
        daysLeft: 7,
        participants: 840,
        imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/internships",
        tags: ["Web Dev", "Cloud"],
        stipend: "₹35,000 / month",
        opportunityType: "internship",
        teamFitScore: 83,
        suggestedRoles: ["Backend Dev", "DevOps Engineer", "Cloud Architect"],
        location: "Mumbai",
    },
    {
        id: "fallback-intern-5",
        title: "Smart Contract Developer Intern",
        organizer: "Polygon Labs",
        daysLeft: 11,
        participants: 920,
        imageUrl: "https://images.unsplash.com/photo-1639762681057-40802193110c?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/internships",
        tags: ["Blockchain", "Web Dev"],
        stipend: "$1,200 / month",
        opportunityType: "internship",
        teamFitScore: 76,
        suggestedRoles: ["Smart Contract Dev", "Web3 Engineer"],
        location: "Remote",
    },
    {
        id: "fallback-intern-6",
        title: "DevOps & Platform Engineering Intern",
        organizer: "AWS Systems",
        daysLeft: 18,
        participants: 1150,
        imageUrl: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/internships",
        tags: ["Cloud", "AI/ML"],
        stipend: "$2,200 / month",
        opportunityType: "internship",
        teamFitScore: 87,
        suggestedRoles: ["DevOps Engineer", "Cloud Architect"],
        location: "Hyderabad",
    },
];

const FALLBACK_JOBS: ArenaHackathon[] = [
    {
        id: "fallback-job-1",
        title: "Full-Stack Software Engineer (Junior)",
        organizer: "Stripe",
        daysLeft: null,
        participants: 1900,
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/jobs",
        tags: ["Web Dev", "Cloud"],
        salary: "$95,000 / year",
        opportunityType: "job",
        teamFitScore: 94,
        suggestedRoles: ["Full-Stack Dev", "Frontend Dev", "Backend Dev"],
        location: "Bengaluru",
    },
    {
        id: "fallback-job-2",
        title: "AI Research Scientist",
        organizer: "Google DeepMind",
        daysLeft: null,
        participants: 4300,
        imageUrl: "https://images.unsplash.com/photo-1675557009875-436f09780264?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/jobs",
        tags: ["AI/ML", "Data Science"],
        salary: "$165,000 / year",
        opportunityType: "job",
        teamFitScore: 91,
        suggestedRoles: ["ML Engineer", "AI Researcher", "Data Scientist"],
        location: "Remote",
    },
    {
        id: "fallback-job-3",
        title: "iOS Mobile Engineer",
        organizer: "Zomato Tech",
        daysLeft: null,
        participants: 1600,
        imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/jobs",
        tags: ["Mobile", "Design"],
        salary: "₹18,00,000 / year",
        opportunityType: "job",
        teamFitScore: 82,
        suggestedRoles: ["Mobile Dev", "React Native Dev", "UI/UX Designer"],
        location: "Delhi NCR",
    },
    {
        id: "fallback-job-4",
        title: "Infrastructure & Platform Engineer",
        organizer: "HashiCorp",
        daysLeft: null,
        participants: 1400,
        imageUrl: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/jobs",
        tags: ["Cloud", "Web Dev"],
        salary: "$120,000 / year",
        opportunityType: "job",
        teamFitScore: 88,
        suggestedRoles: ["DevOps Engineer", "Cloud Architect", "Backend Dev"],
        location: "Remote",
    },
    {
        id: "fallback-job-5",
        title: "DeFi Smart Contract Developer",
        organizer: "Uniswap Labs",
        daysLeft: null,
        participants: 2100,
        imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/jobs",
        tags: ["Blockchain", "Web Dev"],
        salary: "$145,000 / year",
        opportunityType: "job",
        teamFitScore: 85,
        suggestedRoles: ["Smart Contract Dev", "Web3 Engineer"],
        location: "Remote",
    },
    {
        id: "fallback-job-6",
        title: "Product Visual Designer",
        organizer: "CRED Design",
        daysLeft: null,
        participants: 980,
        imageUrl: "https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/jobs",
        tags: ["Design"],
        salary: "₹14,00,000 / year",
        opportunityType: "job",
        teamFitScore: 76,
        suggestedRoles: ["UI/UX Designer", "Product Designer"],
        location: "Pune",
    },
];

// ── Route Handler ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const opportunityType = (searchParams.get("type") || "all") as "all" | "hackathon" | "internship" | "job";

    // Subtype mapping for Unstop URLs
    const typeMapping: Record<string, "hackathons" | "internships" | "jobs"> = {
        hackathon: "hackathons",
        internship: "internships",
        job: "jobs",
    };

    const targetTypes: ("hackathons" | "internships" | "jobs")[] = 
        opportunityType === "all" 
            ? ["hackathons", "internships", "jobs"] 
            : [typeMapping[opportunityType]];

    let combinedResults: ArenaHackathon[] = [];
    let isLiveAny = false;

    for (const oppType of targetTypes) {
        // Check cache first
        const cacheKey = oppType;
        if (cacheMap[cacheKey] && Date.now() - cacheMap[cacheKey].timestamp < CACHE_TTL) {
            combinedResults = [...combinedResults, ...cacheMap[cacheKey].data];
            continue;
        }

        try {
            const data = await scrapeUnstop(oppType);
            if (data.length > 0) {
                cacheMap[cacheKey] = { data, timestamp: Date.now() };
                combinedResults = [...combinedResults, ...data];
                isLiveAny = true;
            } else {
                // Fallback inside scraper
                const fallback = 
                    oppType === "hackathons" 
                        ? FALLBACK_HACKATHONS 
                        : oppType === "internships" 
                            ? FALLBACK_INTERNSHIPS 
                            : FALLBACK_JOBS;
                combinedResults = [...combinedResults, ...fallback];
            }
        } catch (error) {
            console.error(`[Arena API] Scrape failed for ${oppType}, using fallback:`, error);
            const fallback = 
                oppType === "hackathons" 
                    ? FALLBACK_HACKATHONS 
                    : oppType === "internships" 
                        ? FALLBACK_INTERNSHIPS 
                        : FALLBACK_JOBS;
            combinedResults = [...combinedResults, ...fallback];
        }
    }

    return NextResponse.json({
        hackathons: combinedResults,
        source: isLiveAny ? "live" : "fallback",
        count: combinedResults.length,
    });
}
