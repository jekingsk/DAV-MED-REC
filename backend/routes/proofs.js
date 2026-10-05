const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { deleteProofFromCloudinary } = require("../services/cloudinary");
const { verifyAdminUserInFirestore } = require("../services/firebase");
const { getLocalProofFilePath } = require("../services/proofSync");

// POST /api/delete-cloudinary-proof
router.post("/delete-cloudinary-proof", async (req, res) => {
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
        error: "Unauthorized: Missing administrative credentials or token.",
      });
    }

    const authCheck = await verifyAdminUserInFirestore(adminIdentifier);
    if (!authCheck.isAdmin) {
      return res.status(403).json({
        success: false,
        error:
          authCheck.error ||
          "Forbidden: Only verified administrators are permitted.",
      });
    }

    const { publicId, resourceType } = body;

    if (!publicId || typeof publicId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Invalid request: 'publicId' string is required.",
      });
    }

    const trimmedPublicId = publicId.trim();

    if (
      trimmedPublicId.includes("..") ||
      trimmedPublicId.includes("\0") ||
      !/^[a-zA-Z0-9_\-\/\.]+$/.test(trimmedPublicId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid request: 'publicId' contains disallowed characters.",
      });
    }

    const validResourceType =
      resourceType === "raw" || resourceType === "pdf" ? "raw" : "image";

    const deletionResult = await deleteProofFromCloudinary(
      trimmedPublicId,
      validResourceType
    );

    if (!deletionResult.success) {
      return res.status(502).json({
        success: false,
        error: deletionResult.message || "Cloudinary deletion failed.",
        publicId: trimmedPublicId,
      });
    }

    return res.json({
      success: true,
      message: deletionResult.message,
      publicId: trimmedPublicId,
      result: deletionResult.result,
      deletedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[DeleteCloudinaryProof] Error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error during proof deletion.",
    });
  }
});

// GET /api/download-proxy
router.get("/download-proxy", async (req, res) => {
  try {
    const targetUrl = req.query.url;
    const requestedFilename = req.query.filename || "Medical_Proof.pdf";

    if (!targetUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid target URL scheme" });
    }

    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Remote resource fetch failed: ${response.statusText}`,
      });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await response.arrayBuffer();
    const cleanFilename = requestedFilename.replace(/[^a-zA-Z0-9._-]/g, "_");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${cleanFilename}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Failed to download proxy file",
    });
  }
});

// GET /medical-proofs/:filename (Direct route)
router.get("/medical-proofs/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const fileCheck = getLocalProofFilePath(filename);

    if (!fileCheck.filePath) {
      return res.status(fileCheck.status).json({
        error: fileCheck.error,
      });
    }

    const filePath = fileCheck.filePath;
    const ext = path.extname(filePath).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";

    const cleanFilename = path.basename(filePath);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${cleanFilename}"`);
    res.setHeader("Cache-Control", "private, no-cache");
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json({ error: "Failed to serve proof file" });
  }
});

module.exports = router;
