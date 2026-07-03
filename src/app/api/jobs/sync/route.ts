import { NextRequest, NextResponse } from "next/server";
import { SyncManager } from "@/lib/jobs/sync-manager";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || "software developer";
    const location = body.location || "India";
    
    console.log(`[API Sync] Starting database aggregation sync for query: "${query}", location: "${location}"...`);
    const result = await SyncManager.runSync(query, location);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API Sync] Endpoint crashed:", error);
    return NextResponse.json(
      { error: "Aggregation sync failed", details: error.message },
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest) {
  // Allow trigger via simple GET query for cron schedulers
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "software developer";
    const location = searchParams.get("location") || "India";
    
    console.log(`[API Sync] Triggered GET sync for query: "${query}", location: "${location}"...`);
    const result = await SyncManager.runSync(query, location);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API Sync GET] Endpoint crashed:", error);
    return NextResponse.json(
      { error: "Aggregation sync failed", details: error.message },
      { status: 500 }
    );
  }
}
