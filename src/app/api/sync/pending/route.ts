import { NextResponse } from "next/server";
import { getUnsyncedApplications, getSyncStats } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const unsynced = await getUnsyncedApplications();
    const stats = getSyncStats();

    return NextResponse.json({
      success: true,
      pendingCount: unsynced.length,
      applications: unsynced,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve pending sync applications" },
      { status: 500 }
    );
  }
}
