const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { db } = require("./db");
const { deleteProofFromCloudinary } = require("./cloudinary");

let firestoreDb = null;
let isFirebaseConfigured = false;

function initFirebase() {
  if (firestoreDb) return firestoreDb;

  try {
    if (admin.apps.length > 0) {
      firestoreDb = admin.firestore();
      isFirebaseConfigured = true;
      return firestoreDb;
    }

    // 1. Check for local serviceAccountKey.json
    const serviceKeyPath = path.join(__dirname, "..", "serviceAccountKey.json");
    if (fs.existsSync(serviceKeyPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, "utf-8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firestoreDb = admin.firestore();
      isFirebaseConfigured = true;
      console.log("[Firebase] Admin initialized via serviceAccountKey.json for project:", serviceAccount.project_id);
      return firestoreDb;
    }

    // 2. Check for environment variables (ideal for Render deployment)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = rawKey ? rawKey.replace(/\\n/g, "\n") : undefined;

    const isPlaceholder =
      !projectId ||
      projectId === "your_firebase_project_id" ||
      !privateKey ||
      privateKey.includes("...");

    if (!isPlaceholder && projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      firestoreDb = admin.firestore();
      isFirebaseConfigured = true;
      console.log("[Firebase] Admin initialized via environment variables for project:", projectId);
      return firestoreDb;
    }
  } catch (err) {
    console.warn("[Firebase] Initialization skipped / unavailable:", err.message);
  }

  return null;
}

// Audit log store
const AUDIT_LOG_FILE = path.join(__dirname, "..", "data", "sync_audit_log.json");

function loadAuditLogs() {
  try {
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      const raw = fs.readFileSync(AUDIT_LOG_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[Firebase] Failed to load audit logs:", err.message);
  }
  return [];
}

function saveAuditLog(entry) {
  try {
    const logs = loadAuditLogs();
    logs.unshift(entry);
    const trimmed = logs.slice(0, 500);
    const dataDir = path.dirname(AUDIT_LOG_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Firebase] Failed to save audit log:", err.message);
  }
}

async function saveApplicationToFirebase(application) {
  const fsInstance = initFirebase();

  if (fsInstance) {
    try {
      const collections = ["medicalApplications", "medical_leave_applications"];
      const payload = {
        ...application,
        medicalProofUrl:
          application.medicalProofUrl ||
          application.cloudinaryUrl ||
          application.medicalCertificateUrl,
        firebaseUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      for (const col of collections) {
        const docRef = fsInstance.collection(col).doc(application.applicationId);
        await docRef.set(payload, { merge: true });
      }
      console.log(`[Firebase] Application ${application.applicationId} saved to Firestore.`);
    } catch (err) {
      console.error("[Firebase] Firestore write failed:", err.message);
    }
  }
}

async function updateApplicationInFirestore(applicationId, updates) {
  const fsInstance = initFirebase();
  if (fsInstance) {
    try {
      const collections = ["medicalApplications", "medical_leave_applications"];
      for (const col of collections) {
        const docRef = fsInstance.collection(col).doc(applicationId);
        await docRef.set(
          {
            ...updates,
            firebaseUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      console.log(`[Firebase] Application ${applicationId} updated in Firestore:`, Object.keys(updates));
    } catch (err) {
      console.warn(`[Firebase] Failed to update application ${applicationId} in Firestore:`, err.message);
    }
  }

  const app = db.getApplicationById(applicationId);
  if (app) {
    Object.assign(app, updates);
    app.updatedAt = new Date().toISOString();
  }
}

async function getApplicationsFromFirestore() {
  const fsInstance = initFirebase();
  if (fsInstance) {
    try {
      const collections = ["medicalApplications", "medical_leave_applications"];
      const appMap = new Map();

      for (const col of collections) {
        const snapshot = await fsInstance.collection(col).get();
        if (!snapshot.empty) {
          for (const doc of snapshot.docs) {
            const data = doc.data();
            const key = data.applicationId || doc.id;
            appMap.set(key, {
              ...data,
              medicalProofUrl:
                data.medicalProofUrl || data.cloudinaryUrl || data.medicalCertificateUrl,
            });
          }
        }
      }

      if (appMap.size > 0) {
        return Array.from(appMap.values());
      }
    } catch (err) {
      console.warn("[Firebase] Could not fetch applications from Firestore:", err.message);
    }
  }
  return [];
}

async function verifyAdminUserInFirestore(uidOrToken) {
  if (!uidOrToken || typeof uidOrToken !== "string") {
    return { isAdmin: false, error: "Missing authentication identifier" };
  }

  const cleanUid = uidOrToken.trim();
  const fsInstance = initFirebase();

  if (fsInstance) {
    try {
      const userDoc = await fsInstance.collection("users").doc(cleanUid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.role === "admin") {
          return { isAdmin: true, uid: cleanUid };
        } else {
          return {
            isAdmin: false,
            error: `User ${cleanUid} role is '${userData?.role}', not 'admin'`,
          };
        }
      }

      const registeredAdmin = db.getAdmins().find(
        (a) =>
          a.id.toLowerCase() === cleanUid.toLowerCase() ||
          a.email.toLowerCase() === cleanUid.toLowerCase()
      );

      if (registeredAdmin) {
        await fsInstance.collection("users").doc(registeredAdmin.id).set(
          {
            uid: registeredAdmin.id,
            name: registeredAdmin.name,
            email: registeredAdmin.email,
            role: "admin",
            department: registeredAdmin.department,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return { isAdmin: true, uid: registeredAdmin.id };
      }

      const student = db.getStudentById(cleanUid);
      if (student) {
        return {
          isAdmin: false,
          error: "Access denied: student accounts cannot perform administrative actions.",
        };
      }
    } catch (err) {
      console.warn("[Firebase] Error querying users collection:", err.message);
    }
  }

  const localAdmin = db.getAdmins().find(
    (a) =>
      a.id.toLowerCase() === cleanUid.toLowerCase() ||
      a.email.toLowerCase() === cleanUid.toLowerCase()
  );
  if (localAdmin) {
    return { isAdmin: true, uid: localAdmin.id };
  }

  return { isAdmin: false, error: "Access denied: invalid admin authentication" };
}

async function getUnsyncedApplications() {
  const fsInstance = initFirebase();

  if (fsInstance) {
    try {
      const snapshot = await fsInstance
        .collection("medical_leave_applications")
        .where("syncStatus", "in", ["PENDING_SYNC", "SYNC_FAILED"])
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((d) => d.data());
      }
    } catch (err) {
      console.warn("[Firebase] Could not query unsynced applications from Firestore:", err.message);
    }
  }

  const all = db.getApplications();
  return all.filter((app) => {
    return (
      !app.syncStatus ||
      app.syncStatus === "PENDING_SYNC" ||
      app.syncStatus === "SYNC_FAILED"
    );
  });
}

async function completeVerifiedSync(params) {
  const { applicationId, facultyPcId, localFilePath, localFileHash } = params;

  const app = db.getApplicationById(applicationId);
  if (!app) {
    return { success: false, message: `Application ${applicationId} not found` };
  }

  const now = new Date().toISOString();

  await updateApplicationInFirestore(applicationId, {
    syncStatus: "CLOUDINARY_DELETE_PENDING",
    syncedAt: now,
    facultyPcId,
    localFilePath,
    localFileHash,
  });

  let cloudinarySuccess = true;
  let cloudinaryMsg = "No Cloudinary proof to delete";

  if (app.cloudinaryPublicId && !app.cloudinaryDeleted) {
    try {
      const delRes = await deleteProofFromCloudinary(app.cloudinaryPublicId);
      cloudinarySuccess = delRes.success;
      cloudinaryMsg = delRes.message;
    } catch (err) {
      cloudinarySuccess = false;
      cloudinaryMsg = err.message || "Cloudinary deletion error";
    }
  }

  const finalStatus = cloudinarySuccess ? "SYNCED" : "CLOUDINARY_DELETE_PENDING";
  await updateApplicationInFirestore(applicationId, {
    syncStatus: finalStatus,
    cloudinaryDeleted: cloudinarySuccess,
    cloudinaryDeletedAt: cloudinarySuccess ? now : undefined,
  });

  saveAuditLog({
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    applicationId,
    action: "CLOUDINARY_DELETE",
    facultyPcId,
    status: cloudinarySuccess ? "SUCCESS" : "FAILED",
    details: `Sync verified to ${localFilePath}. Cloudinary cleanup: ${cloudinaryMsg}`,
    timestamp: now,
    fileHash: localFileHash,
    filePath: localFilePath,
  });

  return {
    success: true,
    message: `Application ${applicationId} successfully synchronized to ${facultyPcId}. ${cloudinaryMsg}`,
    app,
  };
}

function getSyncStats() {
  const apps = db.getApplications();
  const logs = loadAuditLogs();

  const pendingApps = apps.filter(
    (a) => !a.syncStatus || a.syncStatus === "PENDING_SYNC" || a.syncStatus === "SYNC_FAILED"
  );
  const syncedApps = apps.filter((a) => a.syncStatus === "SYNCED");
  const pendingDocs = apps.filter(
    (a) => a.cloudinaryPublicId && !a.cloudinaryDeleted
  );
  const errors = apps.filter((a) => a.syncStatus === "SYNC_FAILED");
  const lastLog = logs.find((l) => l.action === "CLOUDINARY_DELETE" && l.status === "SUCCESS");

  return {
    connectionStatus: isFirebaseConfigured ? "Connected" : "Connected (Local Mode)",
    pendingApplications: pendingApps.length,
    syncedApplications: syncedApps.length,
    pendingDocuments: pendingDocs.length,
    syncErrors: errors.length,
    lastSyncTime: lastLog ? lastLog.timestamp : undefined,
    facultyPcId: lastLog ? lastLog.facultyPcId : undefined,
  };
}

module.exports = {
  initFirebase,
  saveApplicationToFirebase,
  updateApplicationInFirestore,
  getApplicationsFromFirestore,
  verifyAdminUserInFirestore,
  getUnsyncedApplications,
  completeVerifiedSync,
  getSyncStats,
  loadAuditLogs,
  saveAuditLog,
};
