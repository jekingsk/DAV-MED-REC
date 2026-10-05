import { NextResponse } from "next/server";
import { deleteProofFromCloudinary } from "@/lib/cloudinary";
import { verifyAdminUserInFirestore } from "@/lib/firebase";

/**
 * Secure Backend Endpoint: Delete Medical Proof from Cloudinary
 * 
 * Invoked by authorized Admin after medical proof has been safely downloaded.
 * 
 * Security:
 * - Checks 'users/{uid}.role == "admin"' in Firestore
 * - Rejects any student or unauthenticated requests with 403/401
 * - Sanitizes publicId
 * - Uses server-side Cloudinary credentials only (never exposed to client)
 * - Keeps Firestore application record intact permanently
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate and Authorize the Admin
    // Header priority: x-admin-uid or Authorization: Bearer <tokenOrUid>
    const authHeader = req.headers.get("authorization");
    const adminUidHeader = req.headers.get("x-admin-uid");

    let adminIdentifier = adminUidHeader;
    if (!adminIdentifier && authHeader?.startsWith("Bearer ")) {
      adminIdentifier = authHeader.replace("Bearer ", "").trim();
    }

    const body = await req.json().catch(() => ({}));
    if (!adminIdentifier && body.adminUid) {
      adminIdentifier = body.adminUid;
    }

    if (!adminIdentifier) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Missing administrative credentials or token.",
        },
        { status: 401 }
      );
    }

    // Verify independently in Firestore that users/{uid}.role == "admin"
    // Never trust a client-side role: "admin"
    const authCheck = await verifyAdminUserInFirestore(adminIdentifier);
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            authCheck.error ||
            "Forbidden: Only verified administrators with role 'admin' in users/{uid} are permitted.",
        },
        { status: 403 }
      );
    }

    // 2. Validate & Sanitize the Cloudinary Public ID
    const { publicId, resourceType } = body;

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: 'publicId' string is required.",
        },
        { status: 400 }
      );
    }

    const trimmedPublicId = publicId.trim();

    // Prevent directory traversal or malicious injection in publicId
    if (
      trimmedPublicId.includes("..") ||
      trimmedPublicId.includes("\0") ||
      !/^[a-zA-Z0-9_\-\/\.]+$/.test(trimmedPublicId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: 'publicId' contains disallowed characters.",
        },
        { status: 400 }
      );
    }

    // Sanitize resourceType (image or raw)
    const validResourceType =
      resourceType === "raw" || resourceType === "pdf" ? "raw" : "image";

    // 3. Call Cloudinary Authenticated Deletion API using server-side credentials
    const deletionResult = await deleteProofFromCloudinary(
      trimmedPublicId,
      validResourceType
    );

    if (!deletionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: deletionResult.message || "Cloudinary deletion failed.",
          publicId: trimmedPublicId,
        },
        { status: 502 }
      );
    }

    // 4. Return success only after Cloudinary confirms deletion (or already removed)
    // NOTE: The Firestore medical leave application record is PRESERVED permanently.
    return NextResponse.json({
      success: true,
      message: deletionResult.message,
      publicId: trimmedPublicId,
      result: deletionResult.result,
      deletedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[DeleteCloudinaryProof] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error during proof deletion.",
      },
      { status: 500 }
    );
  }
}
