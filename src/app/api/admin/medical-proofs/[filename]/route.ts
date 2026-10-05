import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyAdminUserInFirestore } from "@/lib/firebase";
import { getLocalProofFilePath } from "@/lib/proofSyncService";

/**
 * GET /api/admin/medical-proofs/:filename
 * 
 * Secure Admin Endpoint to serve locally stored medical proofs:
 * 1. Authenticates Admin (users/{uid}.role == "admin")
 * 2. Sanitizes filename and prevents directory traversal
 * 3. Confirms requested file exists strictly within 'medical-proofs/'
 * 4. Returns the file with proper Content-Type for viewing (PDF/Image)
 */
export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const { searchParams } = new URL(req.url);

    // 1. Authenticate Admin
    const authHeader = req.headers.get("authorization");
    const adminUidHeader = req.headers.get("x-admin-uid");
    const queryUid = searchParams.get("adminUid") || searchParams.get("uid");

    let adminIdentifier = adminUidHeader || queryUid;
    if (!adminIdentifier && authHeader?.startsWith("Bearer ")) {
      adminIdentifier = authHeader.replace("Bearer ", "").trim();
    }

    if (!adminIdentifier) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Administrator authentication required to view medical proofs.",
        },
        { status: 401 }
      );
    }

    // Verify user's Firebase role is 'admin' (users/{uid}.role == "admin")
    const authCheck = await verifyAdminUserInFirestore(adminIdentifier);
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            authCheck.error ||
            "Forbidden: Student or unauthorized accounts cannot access local medical proofs.",
        },
        { status: 403 }
      );
    }

    // 2. Validate, sanitize, and verify file is inside medical-proofs
    const fileCheck = getLocalProofFilePath(filename);
    if (!fileCheck.filePath) {
      return NextResponse.json(
        { success: false, error: fileCheck.error },
        { status: fileCheck.status }
      );
    }

    const filePath = fileCheck.filePath;
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Determine MIME type
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";

    const cleanFilename = path.basename(filePath);

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${cleanFilename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    console.error("[GetLocalMedicalProof] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to retrieve local proof file" },
      { status: 500 }
    );
  }
}
