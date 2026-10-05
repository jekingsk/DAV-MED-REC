import fs from "fs";
import path from "path";
import { MedicalLeaveApplication } from "@/types";
import { deleteProofFromCloudinary } from "./cloudinary";
import {
  getApplicationsFromFirestore,
  updateApplicationInFirestore,
  verifyAdminUserInFirestore,
} from "./firebase";
import { db } from "./db";

// Dedicated Local Medical Proofs Directory (Section 1)
export const MEDICAL_PROOFS_DIR = path.join(process.cwd(), "medical-proofs");

/**
 * Automatically create medical-proofs directory if it does not exist
 */
export function ensureMedicalProofsDir(): string {
  if (!fs.existsSync(MEDICAL_PROOFS_DIR)) {
    fs.mkdirSync(MEDICAL_PROOFS_DIR, { recursive: true });
    console.log(`[Storage] Initialized medical proofs directory: ${MEDICAL_PROOFS_DIR}`);
  }
  return MEDICAL_PROOFS_DIR;
}

/**
 * Format local filename strictly adhering to:
 * {registrationNumber}_{studentName}_MedicalProof_{applicationId}.{extension}
 * Sanitized for Windows filesystem safety with zero path traversal
 */
export function buildLocalProofFilename(
  app: MedicalLeaveApplication,
  overrideExt?: string
): string {
  const sanitize = (str: string) =>
    (str || "Unknown")
      .trim()
      .replace(/[\/\\:*?"<>|]/g, "_")
      .replace(/\s+/g, "_");

  const regNum = sanitize(app.studentId);
  const studentName = sanitize(app.studentName);
  const appId = sanitize(app.applicationId);

  let ext = overrideExt?.replace(/^\./, "").toLowerCase();
  if (!ext) {
    const docName =
      app.medicalCertificateName || app.cloudinaryOriginalName || "";
    const dotIdx = docName.lastIndexOf(".");
    if (dotIdx !== -1) {
      ext = docName.slice(dotIdx + 1).toLowerCase();
    }
  }

  if (!ext || !["pdf", "jpg", "jpeg", "png", "webp"].includes(ext)) {
    if (app.cloudinaryResourceType === "raw") ext = "pdf";
    else if (app.cloudinaryResourceType === "image") ext = "jpg";
    else ext = "pdf";
  }

  return `${regNum}_${studentName}_MedicalProof_${appId}.${ext}`;
}

export interface SyncProofResult {
  applicationId: string;
  filename: string;
  storedLocally: boolean;
  cloudinaryDeleted: boolean;
  error?: string;
  status: "STORED_AND_PURGED" | "ALREADY_STORED" | "STORAGE_FAILED" | "PURGE_FAILED" | "NO_PROOF";
}

/**
 * Synchronize a single application's medical proof:
 * 1. Check if expected local file already exists (prevent duplicate download)
 * 2. Download from Cloudinary if not yet stored
 * 3. Save into medical-proofs/
 * 4. Verify local file exists & non-empty
 * 5. Update Firestore record
 * 6. ONLY AFTER local verification, delete Cloudinary copy
 * 7. Update Firestore deletion state
 */
export async function syncSingleProof(
  app: MedicalLeaveApplication
): Promise<SyncProofResult> {
  ensureMedicalProofsDir();

  const proofUrl =
    app.medicalProofUrl || app.cloudinaryUrl || app.medicalCertificateUrl;
  const publicId = app.cloudinaryPublicId;

  if (!proofUrl && !publicId) {
    return {
      applicationId: app.applicationId,
      filename: "",
      storedLocally: false,
      cloudinaryDeleted: false,
      status: "NO_PROOF",
    };
  }

  const filename = app.localProofFilename || buildLocalProofFilename(app);
  const targetPath = path.join(MEDICAL_PROOFS_DIR, filename);

  // Section 11: Check whether the expected local file already exists
  const alreadyExists =
    fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0;

  if (alreadyExists) {
    // File exists and is valid on disk. Do NOT download again.
    let cloudDeleted = Boolean(app.cloudinaryDeleted);

    // If Cloudinary still has a copy, safely delete it
    if (publicId && !cloudDeleted) {
      const delRes = await deleteProofFromCloudinary(
        publicId,
        app.cloudinaryResourceType
      );
      if (delRes.success) {
        cloudDeleted = true;
      }
    }

    // Ensure Firestore reflects local storage state
    await updateApplicationInFirestore(app.applicationId, {
      localProofFilename: filename,
      localProofPath: `medical-proofs/${filename}`,
      localProofStored: true,
      localProofStoredAt: app.localProofStoredAt || new Date().toISOString(),
      cloudinaryDeleted: cloudDeleted,
      cloudinaryDeletedAt: cloudDeleted ? new Date().toISOString() : undefined,
    });

    return {
      applicationId: app.applicationId,
      filename,
      storedLocally: true,
      cloudinaryDeleted: cloudDeleted,
      status: "ALREADY_STORED",
    };
  }

  // File does NOT exist locally: Download through server-side fetch
  try {
    if (!proofUrl) {
      throw new Error("No download URL available for medical proof");
    }

    let buffer: Buffer | null = null;

    if (proofUrl.startsWith("data:")) {
      const base64Data = proofUrl.includes(",")
        ? proofUrl.split(",")[1]
        : proofUrl;
      buffer = Buffer.from(base64Data, "base64");
    } else if (proofUrl.startsWith("/api/sync/proof-stream")) {
      // Direct reading if local simulated file exists in data/temp_cloudinary_proofs
      try {
        const u = new URL(proofUrl, "http://localhost:3000");
        const appIdParam = u.searchParams.get("appId");
        const fileParam = u.searchParams.get("file");
        if (appIdParam && fileParam) {
          const cleanApp = appIdParam.replace(/[^a-zA-Z0-9_-]/g, "_");
          const localSrc = path.join(
            process.cwd(),
            "data",
            "temp_cloudinary_proofs",
            cleanApp,
            path.basename(fileParam)
          );
          if (fs.existsSync(localSrc)) {
            buffer = fs.readFileSync(localSrc);
          }
        }
      } catch (readErr) {
        console.warn("Could not read local source directly, trying HTTP fetch:", readErr);
      }

      if (!buffer) {
        const fullUrl = `http://localhost:${process.env.PORT || 3000}${proofUrl}`;
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error(`Fetch failed: HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }
    } else {
      const fullUrl = proofUrl.startsWith("http")
        ? proofUrl
        : `http://localhost:${process.env.PORT || 3000}${proofUrl}`;
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Remote proof download failed: HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    if (!buffer || buffer.length === 0) {
      throw new Error("Downloaded proof document is empty (0 bytes)");
    }

    // Save to dedicated medical-proofs directory
    fs.writeFileSync(targetPath, buffer);

    // Verify the file exists on disk and is non-empty
    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size === 0) {
      throw new Error("Verification failed: file missing or empty after writing to disk");
    }

    const storedAt = new Date().toISOString();

    // Update Firestore to indicate local storage succeeded
    await updateApplicationInFirestore(app.applicationId, {
      localProofFilename: filename,
      localProofPath: `medical-proofs/${filename}`,
      localProofStored: true,
      localProofStoredAt: storedAt,
    });

    console.log(
      `[Storage] Medical proof successfully saved to Admin PC: ${targetPath} (${buffer.length} bytes)`
    );

    // Section 6: ONLY AFTER successful local storage, delete Cloudinary copy
    let cloudDeleted = false;
    if (publicId) {
      try {
        const delRes = await deleteProofFromCloudinary(
          publicId,
          app.cloudinaryResourceType
        );
        if (delRes.success) {
          cloudDeleted = true;
          await updateApplicationInFirestore(app.applicationId, {
            cloudinaryDeleted: true,
            cloudinaryDeletedAt: new Date().toISOString(),
          });
          console.log(`[Cloudinary] Proof ${publicId} purged after verified local backup.`);
        } else {
          console.warn(`[Cloudinary] Deletion deferred: ${delRes.message}`);
        }
      } catch (delErr: any) {
        console.warn(`[Cloudinary] Deletion error for ${publicId}:`, delErr?.message);
      }
    } else {
      cloudDeleted = true;
    }

    return {
      applicationId: app.applicationId,
      filename,
      storedLocally: true,
      cloudinaryDeleted: cloudDeleted,
      status: cloudDeleted ? "STORED_AND_PURGED" : "PURGE_FAILED",
    };
  } catch (err: any) {
    console.error(`[Storage] Failed to transfer proof for ${app.applicationId}:`, err);

    // CRITICAL DATA-SAFETY RULE:
    // If local storage fails:
    // - DO NOT delete Cloudinary.
    // - Keep the Cloudinary copy.
    // - Do not mark the application as locally stored.
    // - Retry during next Admin synchronization.
    return {
      applicationId: app.applicationId,
      filename,
      storedLocally: false,
      cloudinaryDeleted: false,
      error: err?.message || "Storage transfer failed",
      status: "STORAGE_FAILED",
    };
  }
}

/**
 * Synchronize all pending applications from Firestore that need local storage:
 * - Scans Firestore medical applications
 * - Identifies applications where !localProofStored or file missing
 * - Transfers to medical-proofs/
 * - Deletes Cloudinary copy only after local storage confirmation
 */
export async function syncAllPendingProofs(): Promise<{
  success: boolean;
  totalFound: number;
  storedCount: number;
  alreadyStoredCount: number;
  deletedCount: number;
  failedCount: number;
  message: string;
  results: SyncProofResult[];
}> {
  ensureMedicalProofsDir();

  // 1. Fetch applications from Firestore and local DB
  const fsApps = await getApplicationsFromFirestore();
  const localApps = db.getApplications();

  const combinedMap = new Map<string, MedicalLeaveApplication>();
  for (const a of localApps) combinedMap.set(a.applicationId || a.id, a);
  for (const a of fsApps) combinedMap.set(a.applicationId || a.id, { ...(combinedMap.get(a.applicationId || a.id) || {}), ...a });

  const allApps = Array.from(combinedMap.values());

  // 2. Identify applications requiring local transfer
  const candidates = allApps.filter((app) => {
    const hasProof = Boolean(
      app.medicalProofUrl || app.cloudinaryUrl || app.medicalCertificateUrl || app.cloudinaryPublicId
    );
    if (!hasProof) return false;

    // Needs processing if not marked locally stored, or if local file is missing on disk
    if (!app.localProofStored || !app.localProofFilename) return true;

    const localPath = path.join(MEDICAL_PROOFS_DIR, app.localProofFilename);
    const fileMissing = !fs.existsSync(localPath) || fs.statSync(localPath).size === 0;
    if (fileMissing) return true;

    // Needs Cloudinary cleanup if file exists but Cloudinary not deleted yet
    if (app.cloudinaryPublicId && !app.cloudinaryDeleted) return true;

    return false;
  });

  if (candidates.length === 0) {
    return {
      success: true,
      totalFound: 0,
      storedCount: 0,
      alreadyStoredCount: 0,
      deletedCount: 0,
      failedCount: 0,
      message: "No new medical proofs found.",
      results: [],
    };
  }

  let storedCount = 0;
  let alreadyStoredCount = 0;
  let deletedCount = 0;
  let failedCount = 0;
  const results: SyncProofResult[] = [];

  for (const app of candidates) {
    const res = await syncSingleProof(app);
    results.push(res);

    if (res.status === "STORED_AND_PURGED") {
      storedCount++;
      deletedCount++;
    } else if (res.status === "ALREADY_STORED") {
      alreadyStoredCount++;
      if (res.cloudinaryDeleted) deletedCount++;
    } else if (res.status === "PURGE_FAILED") {
      storedCount++;
    } else if (res.status === "STORAGE_FAILED") {
      failedCount++;
    }
  }

  // Section 10 message formatting
  let message = "";
  if (failedCount > 0 && storedCount === 0 && alreadyStoredCount === 0) {
    message = `${failedCount} proof(s) could not be synchronized and will be retried.`;
  } else if (failedCount > 0) {
    message = `${storedCount} proof(s) stored locally. ${failedCount} proof could not be synchronized and will be retried.`;
  } else if (storedCount > 0) {
    message = `${storedCount} new medical proof${storedCount > 1 ? "s" : ""} stored locally.`;
  } else if (alreadyStoredCount > 0) {
    message = "No new medical proofs found.";
  } else {
    message = "No new medical proofs found.";
  }

  return {
    success: true,
    totalFound: candidates.length,
    storedCount,
    alreadyStoredCount,
    deletedCount,
    failedCount,
    message,
    results,
  };
}

/**
 * Retrieve absolute path of a local proof file safely (Section 9)
 * Enforces path traversal prevention and ensures file is inside medical-proofs
 */
export function getLocalProofFilePath(filename: string): {
  filePath: string | null;
  error?: string;
  status: number;
} {
  ensureMedicalProofsDir();

  if (!filename || typeof filename !== "string") {
    return { filePath: null, error: "Filename is required", status: 400 };
  }

  const cleanFilename = path.basename(filename.trim());

  // Prevent directory traversal or malicious characters
  if (
    cleanFilename !== filename.trim() ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0")
  ) {
    return {
      filePath: null,
      error: "Invalid filename or path traversal detected",
      status: 400,
    };
  }

  const resolvedPath = path.resolve(MEDICAL_PROOFS_DIR, cleanFilename);
  const resolvedDir = path.resolve(MEDICAL_PROOFS_DIR);

  // Strictly verify target file stays within medical-proofs folder
  if (!resolvedPath.startsWith(resolvedDir)) {
    return {
      filePath: null,
      error: "Access denied: requested file is outside the medical-proofs directory",
      status: 403,
    };
  }

  if (!fs.existsSync(resolvedPath)) {
    return {
      filePath: null,
      error: `Medical proof '${cleanFilename}' not found in local archive`,
      status: 404,
    };
  }

  return { filePath: resolvedPath, status: 200 };
}
