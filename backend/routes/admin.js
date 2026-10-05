const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const {
  verifyAdminUserInFirestore,
  getApplicationsFromFirestore,
} = require("../services/firebase");
const {
  syncAllPendingProofs,
  syncSingleProof,
  getLocalProofFilePath,
} = require("../services/proofSync");
const { db } = require("../services/db");

// POST /api/admin/sync-medical-proofs
router.post("/sync-medical-proofs", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const adminUidHeader = req.headers["x-admin-uid"];

    let adminIdentifier = adminUidHeader;
    if (!adminIdentifier && authHeader?.startsWith("Bearer ")) {
      adminIdentifier = authHeader.replace("Bearer ", "").trim();
    }

    const body = req.body || {};
    if (!adminIdentifier && body.adminUid) {
      adminIdentifier = body.adminUid;
    }

    if (!adminIdentifier) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Missing administrator credentials.",
      });
    }

    const authCheck = await verifyAdminUserInFirestore(adminIdentifier);
    if (!authCheck.isAdmin) {
      return res.status(403).json({
        success: false,
        error:
          authCheck.error ||
          "Forbidden: Only authorized administrators may synchronize medical proofs.",
      });
    }

    // Single application targeted sync
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
        return res.status(404).json({
          success: false,
          error: `Application ${body.applicationId} not found.`,
        });
      }

      if (body.overrideProofUrl) {
        targetApp = { ...targetApp, medicalProofUrl: body.overrideProofUrl };
      }

      const singleResult = await syncSingleProof(targetApp);
      return res.json({
        success: singleResult.storedLocally,
        message: singleResult.storedLocally
          ? `Medical proof for ${targetApp.applicationId} stored locally on Admin PC.`
          : `Failed to store medical proof: ${singleResult.error}`,
        result: singleResult,
      });
    }

    // Full synchronization of all pending proofs
    const syncReport = await syncAllPendingProofs();
    return res.json(syncReport);
  } catch (err) {
    console.error("[AdminSync] Execution error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error during medical proofs synchronization.",
    });
  }
});

// GET /api/admin/medical-proofs/:filename
router.get("/medical-proofs/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const authHeader = req.headers.authorization;
    const adminUidHeader = req.headers["x-admin-uid"];
    const queryUid = req.query.adminUid || req.query.uid;

    let adminIdentifier = adminUidHeader || queryUid;
    if (!adminIdentifier && authHeader?.startsWith("Bearer ")) {
      adminIdentifier = authHeader.replace("Bearer ", "").trim();
    }

    if (!adminIdentifier) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Administrator authentication required to view medical proofs.",
      });
    }

    const authCheck = await verifyAdminUserInFirestore(adminIdentifier);
    if (!authCheck.isAdmin) {
      return res.status(403).json({
        success: false,
        error:
          authCheck.error ||
          "Forbidden: Student or unauthorized accounts cannot access local medical proofs.",
      });
    }

    const fileCheck = getLocalProofFilePath(filename);
    if (!fileCheck.filePath) {
      return res.status(fileCheck.status).json({
        success: false,
        error: fileCheck.error,
      });
    }

    const filePath = fileCheck.filePath;
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";

    const cleanFilename = path.basename(filePath);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${cleanFilename}"`);
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.send(fileBuffer);
  } catch (err) {
    console.error("[GetLocalProof] Error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to retrieve local proof file",
    });
  }
});

module.exports = router;
