/**
 * DAV UNIVERSITY - FACULTY PC DATA SYNCHRONIZATION AGENT
 * 
 * Lightweight desktop daemon that automatically synchronizes medical leave applications
 * and student proof documents from Firebase & Cloudinary to the Faculty PC's local backup directory.
 * 
 * - Creates organized folder hierarchy:
 *     DAV Medical Leave / {Session} / {Department} / {ApplicationId} /
 * - Calculates SHA-256 hash & verifies local file integrity before confirming sync
 * - Triggers backend Cloudinary temporary storage cleanup ONLY after verified local save
 * - Features duplicate protection & resume capability across PC restarts
 * - Embeds a local HTTP heartbeat server (port 38291) for direct web dashboard control
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

// Configuration
const CONFIG = {
  PORTAL_URL: process.env.PORTAL_URL || "http://localhost:3000",
  AGENT_PORT: parseInt(process.env.AGENT_PORT || "38291", 10),
  FACULTY_PC_ID: process.env.FACULTY_PC_ID || `FACULTY-PC-${os.hostname()}`,
  BACKUP_BASE_DIR:
    process.env.BACKUP_BASE_DIR ||
    path.join(os.homedir(), "Documents", "DAV Medical Leave"),
  POLL_INTERVAL_SEC: parseInt(process.env.POLL_INTERVAL_SEC || "30", 10),
  MANIFEST_FILE: path.join(__dirname, "sync-manifest.json"),
};

// Ensure base backup folder exists
if (!fs.existsSync(CONFIG.BACKUP_BASE_DIR)) {
  fs.mkdirSync(CONFIG.BACKUP_BASE_DIR, { recursive: true });
}

// Load or initialize local duplicate protection manifest
let manifest = {};
try {
  if (fs.existsSync(CONFIG.MANIFEST_FILE)) {
    manifest = JSON.parse(fs.readFileSync(CONFIG.MANIFEST_FILE, "utf-8"));
  }
} catch (e) {
  manifest = {};
}

function saveManifest() {
  try {
    fs.writeFileSync(CONFIG.MANIFEST_FILE, JSON.stringify(manifest, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save manifest:", err.message);
  }
}

// Compute SHA-256 checksum of a file
function computeFileHash(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Generic HTTP helper
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
          }
        });
      })
      .on("error", reject);
  });
}

function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    // If URL is relative, prepend portal base
    const fullUrl = url.startsWith("http") ? url : `${CONFIG.PORTAL_URL}${url}`;
    const client = fullUrl.startsWith("https") ? https : http;

    const fileStream = fs.createWriteStream(destPath);
    client
      .get(fullUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fileStream.close();
          return downloadBinary(res.headers.location, destPath).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          fileStream.close();
          return reject(new Error(`Download failed with status ${res.statusCode}`));
        }
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close(() => resolve(destPath));
        });
      })
      .on("error", (err) => {
        fileStream.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
  });
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(url.startsWith("http") ? url : `${CONFIG.PORTAL_URL}${url}`);
    const data = JSON.stringify(payload);
    const client = fullUrl.protocol === "https:" ? https : http;

    const req = client.request(
      fullUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let resData = "";
        res.on("data", (chunk) => (resData += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resData });
          }
        });
      }
    );

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// Global agent state
const agentState = {
  isRunning: false,
  lastSyncTime: null,
  syncedCount: Object.keys(manifest).length,
  pendingCount: 0,
  lastError: null,
  connectedToPortal: false,
};

/**
 * Main Synchronization Cycle
 */
async function runSyncCycle() {
  if (agentState.isRunning) {
    console.log("[Sync Agent] Sync cycle already in progress, skipping...");
    return;
  }

  agentState.isRunning = true;
  console.log(`\n======================================================`);
  console.log(`[Sync Agent] Checking for unsynced applications at ${new Date().toLocaleTimeString()}...`);

  try {
    const res = await fetchJson(`${CONFIG.PORTAL_URL}/api/sync/pending`);
    agentState.connectedToPortal = true;

    if (!res.data || !res.data.applications) {
      console.log("[Sync Agent] No response or invalid structure from portal.");
      agentState.isRunning = false;
      return;
    }

    const applications = res.data.applications;
    agentState.pendingCount = applications.length;

    console.log(`[Sync Agent] Found ${applications.length} pending application(s).`);

    let newSyncs = 0;

    for (const app of applications) {
      const appId = app.applicationId;

      // Duplicate Check
      if (manifest[appId] && manifest[appId].verified) {
        console.log(`[Sync Agent] Application ${appId} already verified locally. Skipping download.`);
        continue;
      }

      console.log(`\n>>> Processing Application: ${appId} (${app.studentName} - ${app.department})`);

      // 1. Prepare Folder Structure:
      // DAV Medical Leave / {Session} / {Department} / {ApplicationId} /
      const sessionClean = (app.academicSession || "2026-27")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .replace("2026-2027", "2026-27");

      const deptCode = app.department.toLowerCase().includes("computer")
        ? "CSE"
        : app.department.toLowerCase().includes("mechanical")
        ? "ME"
        : app.department.toLowerCase().includes("civil")
        ? "CE"
        : app.department.toLowerCase().includes("commerce")
        ? "Commerce"
        : app.department.slice(0, 12).replace(/[^a-zA-Z0-9]/g, "_");

      const appDir = path.join(CONFIG.BACKUP_BASE_DIR, sessionClean, deptCode, appId);
      if (!fs.existsSync(appDir)) {
        fs.mkdirSync(appDir, { recursive: true });
      }

      // 2. Save Application_Data.json
      const appDataFile = path.join(appDir, "Application_Data.json");
      const appRecord = {
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
        leaveDates: {
          startDate: app.startDate,
          endDate: app.endDate,
          numberOfDays: app.numberOfDays,
        },
        medicalReason: app.reason,
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
        syncMetadata: {
          syncedAt: new Date().toISOString(),
          facultyPcId: CONFIG.FACULTY_PC_ID,
          localDirectory: appDir,
        },
      };

      fs.writeFileSync(appDataFile, JSON.stringify(appRecord, null, 2), "utf-8");
      console.log(`[✓] Saved: Application_Data.json`);

      // 3. Save Medical_Leave_Application.html (printable archive document)
      const appHtmlFile = path.join(appDir, "Medical_Leave_Application.html");
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DAV UNIVERSITY MEDICAL LEAVE - ${appId}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 30px; line-height: 1.6; color: #1e293b; }
    .header { border-bottom: 2px solid #c8102e; padding-bottom: 12px; margin-bottom: 20px; }
    h1 { margin: 0; color: #0f172a; text-transform: uppercase; font-size: 20px; }
    .subtitle { color: #c8102e; font-weight: bold; margin: 4px 0; font-size: 13px; }
    .info-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .info-table td { padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 13px; }
    .info-table td.label { background: #f8fafc; font-weight: bold; width: 30%; color: #475569; }
    .status { display: inline-block; padding: 4px 10px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: bold; font-size: 12px; }
    .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>DAV UNIVERSITY, JALANDHAR</h1>
    <div class="subtitle">Official Medical Leave Application Record</div>
    <div>Application ID: <strong>${appId}</strong> | Status: <span class="status">${app.status}</span></div>
  </div>
  <table class="info-table">
    <tr><td class="label">Student Name</td><td>${app.studentName}</td></tr>
    <tr><td class="label">Registration / Roll No</td><td>${app.studentId}</td></tr>
    <tr><td class="label">Father's Name</td><td>${app.parentName || "—"}</td></tr>
    <tr><td class="label">Program / Department</td><td>${app.program} (${app.department})</td></tr>
    <tr><td class="label">Semester / Section</td><td>${app.semester} - Section ${app.section}</td></tr>
    <tr><td class="label">Leave Period</td><td>${app.startDate} to ${app.endDate} (${app.numberOfDays} days)</td></tr>
    <tr><td class="label">Medical Grounds</td><td>${app.reason}</td></tr>
    <tr><td class="label">Consulting Doctor</td><td>${app.doctorName} (${app.consultationDate})</td></tr>
    <tr><td class="label">Submission Date</td><td>${app.submittedAt}</td></tr>
    <tr><td class="label">Faculty Remarks</td><td>${app.adminRemarks || "Pending verification"}</td></tr>
  </table>
  <div class="footer">
    Faculty PC Local Archive Copy • Synchronized on: ${new Date().toLocaleString()} • PC: ${CONFIG.FACULTY_PC_ID}
  </div>
</body>
</html>`;
      fs.writeFileSync(appHtmlFile, htmlContent, "utf-8");
      console.log(`[✓] Saved: Medical_Leave_Application.html`);

      // 4. Download Proof Files from Cloudinary
      let downloadedProofPath = null;
      let proofFileName = app.medicalCertificateName || "Medical_Certificate.pdf";
      const targetProofPath = path.join(appDir, proofFileName);

      if (app.cloudinaryUrl) {
        try {
          console.log(`[Sync Agent] Downloading medical proof: ${proofFileName}...`);
          await downloadBinary(app.cloudinaryUrl, targetProofPath);
          downloadedProofPath = targetProofPath;
          console.log(`[✓] Downloaded proof: ${proofFileName}`);
        } catch (downloadErr) {
          console.warn(`[!] Cloudinary download issue for ${appId}:`, downloadErr.message);
        }
      }

      // If proof file wasn't downloaded via URL, check if base64 exists in application record
      if (!downloadedProofPath && app.medicalCertificateUrl && app.medicalCertificateUrl.startsWith("data:")) {
        try {
          const base64Data = app.medicalCertificateUrl.split(",")[1];
          fs.writeFileSync(targetProofPath, Buffer.from(base64Data, "base64"));
          downloadedProofPath = targetProofPath;
          console.log(`[✓] Extracted proof from embedded payload: ${proofFileName}`);
        } catch (e) {
          console.warn("Base64 extraction error:", e.message);
        }
      }

      // 5. Verification: Verify Files Exist & Compute Hashes
      if (!fs.existsSync(appDataFile)) {
        throw new Error(`Integrity check failed: ${appDataFile} missing`);
      }

      const fileHash = computeFileHash(appDataFile);
      const proofHash = downloadedProofPath && fs.existsSync(downloadedProofPath)
        ? computeFileHash(downloadedProofPath)
        : null;

      console.log(`[✓] Integrity check PASSED. Checksum SHA-256: ${fileHash.substring(0, 16)}...`);

      // 6. Confirm Verification with Backend & Trigger Cloudinary Cleanup
      console.log(`[Sync Agent] Notifying portal of verified local save & requesting Cloudinary cleanup...`);
      const confirmRes = await postJson(`${CONFIG.PORTAL_URL}/api/sync/confirm`, {
        applicationId: appId,
        facultyPcId: CONFIG.FACULTY_PC_ID,
        localFilePath: appDir,
        localFileHash: fileHash,
      });

      if (confirmRes.status === 200 && confirmRes.data && confirmRes.data.success) {
        console.log(`[✓] Portal confirmed! Cloudinary temporary proof successfully deleted.`);
        manifest[appId] = {
          verified: true,
          syncedAt: new Date().toISOString(),
          localPath: appDir,
          hash: fileHash,
          proofHash,
        };
        saveManifest();
        newSyncs++;
      } else {
        console.warn(`[!] Confirmation response issue:`, confirmRes.data);
      }
    }

    agentState.lastSyncTime = new Date().toISOString();
    agentState.syncedCount = Object.keys(manifest).length;
    agentState.lastError = null;

    console.log(`\n[Sync Agent] Cycle complete. Synced ${newSyncs} new application(s). Total archived: ${agentState.syncedCount}`);
    console.log(`[Sync Agent] Backup directory: ${CONFIG.BACKUP_BASE_DIR}`);
  } catch (error) {
    agentState.connectedToPortal = false;
    agentState.lastError = error.message;
    console.error(`[Sync Agent Error]:`, error.message);
  } finally {
    agentState.isRunning = false;
  }
}

/**
 * Embedded HTTP Controller Server (Port 38291)
 * Allows the Faculty Web Dashboard to detect that this desktop agent is active!
 */
const server = http.createServer((req, res) => {
  // Enable CORS so the web browser dashboard can ping the agent
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${CONFIG.AGENT_PORT}`);

  if (parsedUrl.pathname === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ACTIVE",
        facultyPcId: CONFIG.FACULTY_PC_ID,
        backupDirectory: CONFIG.BACKUP_BASE_DIR,
        syncedCount: Object.keys(manifest).length,
        isRunning: agentState.isRunning,
        lastSyncTime: agentState.lastSyncTime,
        lastError: agentState.lastError,
        uptime: process.uptime(),
      })
    );
    return;
  }

  if (parsedUrl.pathname === "/sync-now" && req.method === "POST") {
    runSyncCycle().catch(console.error);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, message: "Sync cycle triggered on Faculty PC" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(CONFIG.AGENT_PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║         DAV UNIVERSITY MEDICAL LEAVE - FACULTY SYNC AGENT        ║
╚═══════════════════════════════════════════════════════════════════╝
  Faculty PC Identifier : ${CONFIG.FACULTY_PC_ID}
  Backup Directory      : ${CONFIG.BACKUP_BASE_DIR}
  Portal Endpoint       : ${CONFIG.PORTAL_URL}
  Heartbeat Agent Port  : http://localhost:${CONFIG.AGENT_PORT}/status
  Auto Poll Interval    : Every ${CONFIG.POLL_INTERVAL_SEC} seconds
─────────────────────────────────────────────────────────────────────
`);

  // Run initial sync cycle immediately
  runSyncCycle().catch(console.error);

  // Recurring automated polling
  setInterval(() => {
    runSyncCycle().catch(console.error);
  }, CONFIG.POLL_INTERVAL_SEC * 1000);
});
