import { NextResponse } from "next/server";
import { verifyAdminUserInFirestore, getApplicationsFromFirestore } from "@/lib/firebase";
import { syncAllPendingProofs, syncSingleProof } from "@/lib/proofSyncService";
import { db } from "@/lib/db";

/**
 * POST /api/admin/sync-medical-proofs
 * 
 * Synchronizes medical proofs from Cloudinary to the Admin PC's local 'medical-proofs/' folder:
 * 1. Authenticates Admin (users/{uid}.role == "admin")
 * 2. Scans medical applications from Firestore
 * 3. Downloads each proof to medical-proofs/
 * 4. Verifies local file exists and is non-empty
 * 5. Updates Firestore with localProofStored: true, localProofFilename, localProofPath
 * 6. ONLY AFTER local verification, deletes corresponding Cloudinary copy
 * 7. Updates Firestore with cloudinaryDeleted: true
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate Admin
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
        { success: false, error: "Unauthorized: Missing administrator credentials." },
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
            "Forbidden: Only authorized administrators may synchronize medical proofs.",
        },
        { status: 403 }
      );
    }

    // Single application targeted sync (optional param in body)
    if (body.applicationId) {
      const fsApps = await getApplicationsFromFirestore();
      let targetApp = fsApps.find(
        (a) => a.applicationId === body.applicationId || a.id === body.applicationId
      );
      if (!targetApp) {
        targetApp = db.getApplications().find(
          (a) => a.applicationId === body.applicationId || a.id === body.applicationId
        );
      }

      if (!targetApp) {
        return NextResponse.json(
          { success: false, error: `Application ${body.applicationId} not found.` },
          { status: 404 }
        );
      }

      if (body.overrideProofUrl) {
        targetApp = { ...targetApp, medicalProofUrl: body.overrideProofUrl };
      }

      const singleResult = await syncSingleProof(targetApp);
      return NextResponse.json({
        success: singleResult.storedLocally,
        message: singleResult.storedLocally
          ? `Medical proof for ${targetApp.applicationId} stored locally on Admin PC.`
          : `Failed to store medical proof: ${singleResult.error}`,
        result: singleResult,
      });
    }

    // 2. Full synchronization of all pending proofs from Firestore
    const syncReport = await syncAllPendingProofs();

    return NextResponse.json(syncReport, { status: 200 });
  } catch (err: any) {
    console.error("[SyncMedicalProofs] Execution error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error during medical proofs synchronization.",
      },
      { status: 500 }
    );
  }
}
