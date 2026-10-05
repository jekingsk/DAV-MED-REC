const fs = require("fs");
const path = require("path");
const { deleteProofFromCloudinary } = require("./cloudinary");
const {
  getApplicationsFromFirestore,
  updateApplicationInFirestore,
} = require("./firebase");
const { db } = require("./db");

const MEDICAL_PROOFS_DIR = path.join(__dirname, "..", "medical-proofs");

function ensureMedicalProofsDir() {
  if (!fs.existsSync(MEDICAL_PROOFS_DIR)) {
    fs.mkdirSync(MEDICAL_PROOFS_DIR, { recursive: true });
    console.log(`[Storage] Initialized medical proofs directory: ${MEDICAL_PROOFS_DIR}`);
  }
  return MEDICAL_PROOFS_DIR;
}

function buildLocalProofFilename(app, overrideExt) {
  const sanitize = (str) =>
    (str || "Unknown")
      .trim()
      .replace(/[\/\\:*?"<>|]/g, "_")
      .replace(/\s+/g, "_");

  const regNum = sanitize(app.studentId);
  const studentName = sanitize(app.studentName);
  const appId = sanitize(app.applicationId);

  let ext = overrideExt ? overrideExt.replace(/^\./, "").toLowerCase() : null;
  if (!ext) {
    const docName = app.medicalCertificateName || app.cloudinaryOriginalName || "";
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

async function syncSingleProof(app) {
  ensureMedicalProofsDir();

  const proofUrl = app.medicalProofUrl || app.cloudinaryUrl || app.medicalCertificateUrl;
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

  const alreadyExists = fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0;

  if (alreadyExists) {
    let cloudDeleted = Boolean(app.cloudinaryDeleted);

    if (publicId && !cloudDeleted) {
      const delRes = await deleteProofFromCloudinary(publicId, app.cloudinaryResourceType);
      if (delRes.success) {
        cloudDeleted = true;
      }
    }

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

  try {
    if (!proofUrl) {
      throw new Error("No download URL available for medical proof");
    }

    let buffer = null;

    if (proofUrl.startsWith("data:")) {
      const base64Data = proofUrl.includes(",") ? proofUrl.split(",")[1] : proofUrl;
      buffer = Buffer.from(base64Data, "base64");
    } else if (proofUrl.startsWith("/api/sync/proof-stream")) {
      try {
        const u = new URL(proofUrl, "http://localhost:5000");
        const appIdParam = u.searchParams.get("appId");
        const fileParam = u.searchParams.get("file");
        if (appIdParam && fileParam) {
          const cleanApp = appIdParam.replace(/[^a-zA-Z0-9_-]/g, "_");
          const localSrc = path.join(
            __dirname,
            "..",
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
        console.warn("[ProofSync] Could not read local source directly:", readErr.message);
      }

      if (!buffer) {
        const fullUrl = `http://localhost:${process.env.PORT || 5000}${proofUrl}`;
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error(`Fetch failed: HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }
    } else {
      const fullUrl = proofUrl.startsWith("http")
        ? proofUrl
        : `http://localhost:${process.env.PORT || 5000}${proofUrl}`;
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

    fs.writeFileSync(targetPath, buffer);

    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size === 0) {
      throw new Error("Verification failed: file missing or empty after writing to disk");
    }

    const storedAt = new Date().toISOString();

    await updateApplicationInFirestore(app.applicationId, {
      localProofFilename: filename,
      localProofPath: `medical-proofs/${filename}`,
      localProofStored: true,
      localProofStoredAt: storedAt,
    });

    console.log(`[Storage] Medical proof saved locally: ${targetPath} (${buffer.length} bytes)`);

    let cloudDeleted = false;
    if (publicId) {
      try {
        const delRes = await deleteProofFromCloudinary(publicId, app.cloudinaryResourceType);
        if (delRes.success) {
          cloudDeleted = true;
          await updateApplicationInFirestore(app.applicationId, {
            cloudinaryDeleted: true,
            cloudinaryDeletedAt: new Date().toISOString(),
          });
          console.log(`[Cloudinary] Proof ${publicId} purged after verified local backup.`);
        }
      } catch (delErr) {
        console.warn(`[Cloudinary] Deletion error for ${publicId}:`, delErr.message);
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
  } catch (err) {
    console.error(`[Storage] Failed to transfer proof for ${app.applicationId}:`, err);
    return {
      applicationId: app.applicationId,
      filename,
      storedLocally: false,
      cloudinaryDeleted: false,
      error: err.message || "Storage transfer failed",
      status: "STORAGE_FAILED",
    };
  }
}

async function syncAllPendingProofs() {
  ensureMedicalProofsDir();

  const fsApps = await getApplicationsFromFirestore();
  const localApps = db.getApplications();

  const combinedMap = new Map();
  for (const a of localApps) combinedMap.set(a.applicationId || a.id, a);
  for (const a of fsApps) combinedMap.set(a.applicationId || a.id, { ...(combinedMap.get(a.applicationId || a.id) || {}), ...a });

  const allApps = Array.from(combinedMap.values());

  const candidates = allApps.filter((app) => {
    const hasProof = Boolean(
      app.medicalProofUrl || app.cloudinaryUrl || app.medicalCertificateUrl || app.cloudinaryPublicId
    );
    if (!hasProof) return false;

    if (!app.localProofStored || !app.localProofFilename) return true;

    const localPath = path.join(MEDICAL_PROOFS_DIR, app.localProofFilename);
    const fileMissing = !fs.existsSync(localPath) || fs.statSync(localPath).size === 0;
    if (fileMissing) return true;

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
  const results = [];

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

function getLocalProofFilePath(filename) {
  ensureMedicalProofsDir();

  if (!filename || typeof filename !== "string") {
    return { filePath: null, error: "Filename is required", status: 400 };
  }

  const cleanFilename = path.basename(filename.trim());

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

module.exports = {
  MEDICAL_PROOFS_DIR,
  ensureMedicalProofsDir,
  buildLocalProofFilename,
  syncSingleProof,
  syncAllPendingProofs,
  getLocalProofFilePath,
};
