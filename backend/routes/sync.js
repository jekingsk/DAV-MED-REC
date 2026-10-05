const express = require("express");
const router = express.Router();
const JSZip = require("jszip");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { db } = require("../services/db");
const {
  getSyncStats,
  loadAuditLogs,
  getUnsyncedApplications,
  completeVerifiedSync,
} = require("../services/firebase");

// GET /api/sync/status
router.get("/status", (req, res) => {
  try {
    const stats = getSyncStats();
    const logs = loadAuditLogs().slice(0, 15);

    return res.json({
      success: true,
      stats,
      auditLogs: logs,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to retrieve sync status",
    });
  }
});

// GET /api/sync/pending
router.get("/pending", async (req, res) => {
  try {
    const unsynced = await getUnsyncedApplications();
    const stats = getSyncStats();

    return res.json({
      success: true,
      pendingCount: unsynced.length,
      applications: unsynced,
      stats,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to retrieve pending sync applications",
    });
  }
});

// POST /api/sync/confirm
router.post("/confirm", async (req, res) => {
  try {
    const { applicationId, facultyPcId, localFilePath, localFileHash } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        error: "Application ID is required for sync confirmation.",
      });
    }

    if (!facultyPcId || !localFilePath || !localFileHash) {
      return res.status(400).json({
        error: "Incomplete sync verification payload. Requires facultyPcId, localFilePath, and localFileHash.",
      });
    }

    const result = await completeVerifiedSync({
      applicationId,
      facultyPcId,
      localFilePath,
      localFileHash,
    });

    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }

    return res.json({
      success: true,
      message: result.message,
      application: result.app,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to confirm synchronization",
    });
  }
});

// GET /api/sync/download-package
router.get("/download-package", async (req, res) => {
  try {
    const appId = req.query.appId;
    const autoConfirm = req.query.autoConfirm === "true";
    const facultyPcId = req.query.facultyPcId || "FACULTY-WEB-DESK";

    let appsToPack = appId
      ? [db.getApplicationById(appId)].filter(Boolean)
      : await getUnsyncedApplications();

    if (appsToPack.length === 0) {
      appsToPack = db.getApplications().slice(0, 10);
    }

    if (appsToPack.length === 0) {
      return res.status(404).json({ error: "No applications available to package." });
    }

    const zip = new JSZip();

    for (const app of appsToPack) {
      if (!app) continue;

      const sessionClean = (app.academicSession || "2026-27")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .replace("2026-2027", "2026-27");

      const dept = app.department || "General";
      const deptCode = dept.toLowerCase().includes("computer")
        ? "CSE"
        : dept.toLowerCase().includes("mechanical")
        ? "ME"
        : dept.toLowerCase().includes("civil")
        ? "CE"
        : dept.toLowerCase().includes("commerce")
        ? "Commerce"
        : dept.slice(0, 12).replace(/[^a-zA-Z0-9]/g, "_");

      const baseFolder = `DAV Medical Leave/${sessionClean}/${deptCode}/${app.applicationId}`;

      const jsonData = {
        applicationId: app.applicationId,
        studentName: app.studentName,
        studentId: app.studentId,
        email: app.email,
        phone: app.phone,
        program: app.program,
        department: app.department,
        semester: app.semester,
        section: app.section,
        academicSession: app.academicSession,
        parentName: app.parentName,
        leaveType: app.leaveType,
        startDate: app.startDate,
        endDate: app.endDate,
        numberOfDays: app.numberOfDays,
        reason: app.reason,
        applicationDate: app.applicationDate,
        doctorDetails: {
          doctorName: app.doctorName,
          consultationDate: app.consultationDate,
          treatmentDetails: app.treatmentDetails,
        },
        applicationStatus: app.status,
        submissionDate: app.submittedAt,
        facultyRemarks: app.adminRemarks || "None",
        reviewedBy: app.reviewedBy || "Pending Review",
        reviewedAt: app.reviewedAt || null,
        timeline: app.timeline,
        backupMetadata: {
          downloadedAt: new Date().toISOString(),
          facultyPcId,
          source: "DAV University Medical Portal (Firebase Firestore)",
        },
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      zip.file(`${baseFolder}/Application_Data.json`, jsonString);

      const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DAV UNIVERSITY - Official Leave Record - ${app.applicationId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; }
    .header { border-bottom: 2px solid #c8102e; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
    .univ-title { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 0; }
    .univ-sub { font-size: 12px; color: #c8102e; font-weight: bold; margin: 2px 0 0 0; }
    .badge { display: inline-block; padding: 4px 10px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .card h3 { margin-top: 0; font-size: 13px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .row span:first-child { color: #64748b; }
    .row span:last-child { font-weight: 600; color: #0f172a; }
    .box { background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 13px; margin-top: 10px; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="univ-title">DAV UNIVERSITY</h1>
      <p class="univ-sub">Official Medical Leave Application & Verification Record</p>
      <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Established under Punjab Act No. 8 of 2013 • Jalandhar, Punjab</p>
    </div>
    <div style="text-align: right;">
      <span class="badge">STATUS: ${(app.status || "").toUpperCase()}</span>
      <p style="font-size: 12px; font-weight: bold; margin: 6px 0 0 0;">${app.applicationId}</p>
    </div>
  </div>
  <div class="grid">
    <div class="card">
      <h3>Student Identification</h3>
      <div class="row"><span>Full Name:</span><span>${app.studentName}</span></div>
      <div class="row"><span>Registration No:</span><span>${app.studentId}</span></div>
      <div class="row"><span>Father's Name:</span><span>${app.parentName || "—"}</span></div>
      <div class="row"><span>Degree / Program:</span><span>${app.program}</span></div>
      <div class="row"><span>Department:</span><span>${app.department}</span></div>
      <div class="row"><span>Semester / Section:</span><span>${app.semester} (Section ${app.section || "A"})</span></div>
      <div class="row"><span>Mobile / Email:</span><span>${app.phone} • ${app.email}</span></div>
    </div>
    <div class="card">
      <h3>Sanction Period & Medical Reason</h3>
      <div class="row"><span>Leave Commences:</span><span>${app.startDate}</span></div>
      <div class="row"><span>Leave Concludes:</span><span>${app.endDate}</span></div>
      <div class="row"><span>Total Duration:</span><span>${app.numberOfDays} Day(s)</span></div>
      <div class="row"><span>Doctor / Hospital:</span><span>${app.doctorName}</span></div>
      <div class="row"><span>Consultation Date:</span><span>${app.consultationDate}</span></div>
      <div class="row"><span>Submitted At:</span><span>${app.submittedAt}</span></div>
      <div class="box"><strong>Clinical Grounds:</strong><br>${app.reason}</div>
    </div>
  </div>
  <div class="footer">
    <div>DAV University Academic Verification Registry • Local Faculty PC Backup Archive</div>
    <div>Application Checksum ID: ${app.id}</div>
  </div>
</body>
</html>`;
      zip.file(`${baseFolder}/Medical_Leave_Application.html`, htmlDocument);

      let proofSaved = false;
      const proofFileName = app.medicalCertificateName || "Medical_Certificate.pdf";
      const cleanAppId = app.applicationId.replace(/[^a-zA-Z0-9_-]/g, "_");
      const tempDir = path.join(__dirname, "..", "data", "temp_cloudinary_proofs", cleanAppId);

      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const f of files) {
          const content = fs.readFileSync(path.join(tempDir, f));
          zip.file(`${baseFolder}/${f}`, content);
          proofSaved = true;
        }
      }

      if (!proofSaved && app.medicalCertificateUrl && app.medicalCertificateUrl.startsWith("data:")) {
        try {
          const base64Data = app.medicalCertificateUrl.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          zip.file(`${baseFolder}/${proofFileName}`, buffer);
          proofSaved = true;
        } catch (e) {
          console.warn("Could not decode proof base64 for zip:", e.message);
        }
      }

      if (!proofSaved) {
        zip.file(
          `${baseFolder}/${proofFileName}.txt`,
          `Medical Certificate Proof Document for ${app.applicationId}\nStudent: ${app.studentName} (${app.studentId})\nDoctor: ${app.doctorName}\nFile Reference: ${app.cloudinaryUrl || "Archived"}`
        );
      }

      if (autoConfirm) {
        const fileHash = crypto.createHash("sha256").update(jsonString).digest("hex");
        const relativeLocalPath = `${baseFolder}/`;

        await completeVerifiedSync({
          applicationId: app.applicationId,
          facultyPcId,
          localFilePath: relativeLocalPath,
          localFileHash: fileHash,
        });
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const zipFilename = `DAV_Medical_Leave_Backup_${timestamp}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);
    res.setHeader("Cache-Control", "no-store");
    return res.send(zipBuffer);
  } catch (error) {
    console.error("[Sync] Failed to generate backup package:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate local backup package",
    });
  }
});

// GET /api/sync/proof-stream
router.get("/proof-stream", (req, res) => {
  try {
    const appId = req.query.appId;
    const fileName = req.query.file;

    if (!appId || !fileName) {
      return res.status(400).json({ error: "Missing appId or file parameter" });
    }

    const cleanAppId = appId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanFileName = path.basename(fileName);
    const filePath = path.join(__dirname, "..", "data", "temp_cloudinary_proofs", cleanAppId, cleanFileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Proof document not found or expired" });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(cleanFileName).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${cleanFileName}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.send(fileBuffer);
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Streaming failed" });
  }
});

module.exports = router;
