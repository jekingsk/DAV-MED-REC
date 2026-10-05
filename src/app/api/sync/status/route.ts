import { NextResponse } from "next/server";
import { getSyncStats, loadAuditLogs } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const stats = getSyncStats();
    const logs = loadAuditLogs().slice(0, 15); // Return latest 15 audit logs

    return NextResponse.json({
      success: true,
      stats,
      auditLogs: logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve sync status" },
      { status: 500 }
    );
  }
}
