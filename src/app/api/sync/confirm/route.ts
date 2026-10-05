import { NextResponse } from "next/server";
import { completeVerifiedSync } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { applicationId, facultyPcId, localFilePath, localFileHash } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required for sync confirmation." },
        { status: 400 }
      );
    }

    if (!facultyPcId || !localFilePath || !localFileHash) {
      return NextResponse.json(
        {
          error:
            "Incomplete sync verification payload. Requires facultyPcId, localFilePath, and localFileHash.",
        },
        { status: 400 }
      );
    }

    const result = await completeVerifiedSync({
      applicationId,
      facultyPcId,
      localFilePath,
      localFileHash,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      application: result.app,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to confirm synchronization" },
      { status: 500 }
    );
  }
}
