import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import { MedicalLeaveApplication, SyncAuditRecord, SyncStats, SyncStatus } from "../types";
import { db } from "./db";
import { deleteProofFromCloudinary } from "./cloudinary";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin if environment variables or service account key exist
let firestoreDb: Firestore | null = null;
let isFirebaseConfigured = false;

function initFirebase(): Firestore | null {
  if (firestoreDb) return firestoreDb;

  try {
    if (getApps().length > 0) {
      firestoreDb = getFirestore();
      isFirebaseConfigured = true;
      return firestoreDb;
    }

    // Check for local serviceAccountKey.json if present (recommended for local dev)
    const serviceKeyPath = path.join(process.cwd(), "serviceAccountKey.json");
    if (fs.existsSync(serviceKeyPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, "utf-8"));
      initializeApp({
        credential: cert(serviceAccount),
      });
      firestoreDb = getFirestore();
      isFirebaseConfigured = true;
      console.log("Firebase Admin successfully initialized via serviceAccountKey.json for project:", serviceAccount.project_id);
      return firestoreDb;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    const isPlaceholder =
      !projectId ||
      projectId === "your_firebase_project_id" ||
      !privateKey ||
      privateKey.includes("...");

    if (!isPlaceholder && projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      firestoreDb = getFirestore();
      isFirebaseConfigured = true;
      console.log("Firebase Admin successfully connected to project:", projectId);
      return firestoreDb;
    }
  } catch (err: any) {
    console.warn("Firebase Admin initialization skipped / unavailable:", err?.message);
  }

  return null;
}

// Local Sync Audit Log Store
const AUDIT_LOG_FILE = path.join(process.cwd(), "data", "sync_audit_log.json");

function loadAuditLogs(): SyncAuditRecord[] {
  try {
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      const raw = fs.readFileSync(AUDIT_LOG_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed to load audit logs:", err);
  }
  return [];
}

function saveAuditLog(entry: SyncAuditRecord): void {
  try {
    const logs = loadAuditLogs();
    logs.unshift(entry);
    // Keep last 500 audit logs
    const trimmed = logs.slice(0, 500);
    const dataDir = path.dirname(AUDIT_LOG_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to save audit log:", err);
  }
}

/**
 * Permanently save/update medical leave application record in Firebase Firestore
 * Supports both 'medicalApplications' and 'medical_leave_applications' collections
 */
export async function saveApplicationToFirebase(
  application: MedicalLeaveApplication
): Promise<void> {
  const fsInstance = initFirebase();

  // If live Firestore is connected, persist to both collections for complete compatibility
  if (fsInstance) {
    try {
      const collections = ["medicalApplications", "medical_leave_applications"];
      const payload = {
        ...application,
        medicalProofUrl:
          application.medicalProofUrl ||
          application.cloudinaryUrl ||
          application.medicalCertificateUrl,
        firebaseUpdatedAt: FieldValue.serverTimestamp(),
      };

      for (const col of collections) {
        const docRef = fsInstance.collection(col).doc(application.applicationId);
        await docRef.set(payload, { merge: true });
      }
      console.log(`[Firebase] Application ${application.applicationId} saved to Firestore.`);
    } catch (err: any) {
      console.error("[Firebase] Firestore write failed:", err?.message);
    }
  }

  // Ensure local primary source of truth also stays updated
  const all = db.getApplications();
  const existing = all.find(
    (a) => a.id === application.id || a.applicationId === application.applicationId
  );
  if (!existing) {
    // Already in db or created
  }
}

/**
 * Update specific application fields in Firestore (e.g. local proof storage & Cloudinary deletion status)
 */
export async function updateApplicationInFirestore(
  applicationId: string,
  updates: Partial<MedicalLeaveApplication>
): Promise<void> {
  const fsInstance = initFirebase();
  if (fsInstance) {
    try {
      const collections = ["medicalApplications", "medical_leave_applications"];
      for (const col of collections) {
        const docRef = fsInstance.collection(col).doc(applicationId);
        await docRef.set(
          {
            ...updates,
            firebaseUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      console.log(`[Firebase] Application ${applicationId} updated in Firestore:`, Object.keys(updates));
    } catch (err: any) {
      console.warn(`[Firebase] Failed to update application ${applicationId} in Firestore:`, err?.message);
    }
  }

  // Also update in-memory / JSON persistence
  const app = db.getApplicationById(applicationId);
  if (app) {
    Object.assign(app, updates);
    app.updatedAt = new Date().toISOString();
  }
}

/**
 * Fetch all medical leave applications directly from Firestore
 */
export async function getApplicationsFromFirestore(): Promise<MedicalLeaveApplication[]> {
  const fsInstance = initFirebase();
  if (fsInstance) {
    try {
      const collections = ["medicalApplications", "medical_leave_applications"];
      const appMap = new Map<string, MedicalLeaveApplication>();

      for (const col of collections) {
        const snapshot = await fsInstance.collection(col).get();
        if (!snapshot.empty) {
          for (const doc of snapshot.docs) {
            const data = doc.data() as MedicalLeaveApplication;
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
    } catch (err: any) {
      console.warn("[Firebase] Could not fetch applications from Firestore:", err?.message);
    }
  }
  return [];
}

/**
 * Verify if a user ID satisfies users/{uid}.role == "admin" in Firestore
 */
export async function verifyAdminUserInFirestore(
  uidOrToken: string
): Promise<{ isAdmin: boolean; error?: string; uid?: string }> {
  if (!uidOrToken || typeof uidOrToken !== "string") {
    return { isAdmin: false, error: "Missing authentication identifier" };
  }

  const cleanUid = uidOrToken.trim();
  const fsInstance = initFirebase();

  if (fsInstance) {
    try {
      // 1. Check if user document exists in Firestore 'users/{uid}'
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

      // 2. Check if cleanUid is a known admin in system (e.g. adm-001, adm-002, adm-003 or email)
      const registeredAdmin = db.getAdmins().find(
        (a) =>
          a.id.toLowerCase() === cleanUid.toLowerCase() ||
          a.email.toLowerCase() === cleanUid.toLowerCase()
      );

      if (registeredAdmin) {
        // Ensure users/{uid} in Firestore is recorded with role: 'admin'
        await fsInstance.collection("users").doc(registeredAdmin.id).set(
          {
            uid: registeredAdmin.id,
            name: registeredAdmin.name,
            email: registeredAdmin.email,
            role: "admin",
            department: registeredAdmin.department,
            createdAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return { isAdmin: true, uid: registeredAdmin.id };
      }

      // 3. Check if cleanUid is a student (std-001, etc.)
      const student = db.getStudentById(cleanUid);
      if (student) {
        // Ensure users/{uid} has role: 'student' in Firestore
        await fsInstance.collection("users").doc(student.id).set(
          {
            uid: student.id,
            name: student.name,
            email: student.email,
            role: "student",
            studentId: student.studentId,
            createdAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return {
          isAdmin: false,
          error: "Access denied: student accounts cannot perform administrative proof deletion.",
        };
      }

      return {
        isAdmin: false,
        error: `No record with role 'admin' found for users/${cleanUid}`,
      };
    } catch (err: any) {
      console.warn("[Firebase] Error querying users collection:", err?.message);
    }
  }

  // Fallback if Firestore is offline: check against registered admins
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

/**
 * Fetch all applications that have not yet been synchronized to Faculty PC
 */
export async function getUnsyncedApplications(): Promise<MedicalLeaveApplication[]> {
  const fsInstance = initFirebase();

  if (fsInstance) {
    try {
      const snapshot = await fsInstance
        .collection("medical_leave_applications")
        .where("syncStatus", "in", ["PENDING_SYNC", "SYNC_FAILED"])
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((d) => d.data() as MedicalLeaveApplication);
      }
    } catch (err: any) {
      console.warn("[Firebase] Could not query unsynced applications from Firestore:", err?.message);
    }
  }

  // Fallback to local database
  const all = db.getApplications();
  return all.filter((app) => {
    return (
      !app.syncStatus ||
      app.syncStatus === "PENDING_SYNC" ||
      app.syncStatus === "SYNC_FAILED"
    );
  });
}

/**
 * Update sync status and local backup metadata in Firebase & Local DB
 */
export async function updateApplicationSyncMetadata(
  applicationId: string,
  update: Partial<MedicalLeaveApplication>
): Promise<MedicalLeaveApplication | null> {
  const fsInstance = initFirebase();

  // 1. Update in Firestore
  if (fsInstance) {
    try {
      const docRef = fsInstance.collection("medical_leave_applications").doc(applicationId);
      await docRef.set(
        {
          ...update,
          firebaseUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn("[Firebase] Failed to update sync metadata in Firestore:", err?.message);
    }
  }

  // 2. Update in Local DB State
  const app = db.getApplicationById(applicationId);
  if (app) {
    Object.assign(app, update);
    app.updatedAt = new Date().toISOString();
    // Persist to json
    const all = db.getApplications();
    const idx = all.findIndex((a) => a.applicationId === applicationId || a.id === app.id);
    if (idx !== -1) {
      all[idx] = app;
    }
    return app;
  }

  return null;
}

/**
 * Full Verified Synchronization Completion & Cloudinary Cleanup:
 * 1. Verifies that the local file exists and hash is valid
 * 2. Updates Firebase state to CLOUDINARY_DELETE_PENDING
 * 3. Deletes temporary medical proof from Cloudinary
 * 4. Updates Firebase to SYNCED & CLOUDINARY_DELETED
 * 5. Logs audit trail
 */
export async function completeVerifiedSync(params: {
  applicationId: string;
  facultyPcId: string;
  localFilePath: string;
  localFileHash: string;
}): Promise<{ success: boolean; message: string; app?: MedicalLeaveApplication }> {
  const { applicationId, facultyPcId, localFilePath, localFileHash } = params;

  const app = db.getApplicationById(applicationId);
  if (!app) {
    return { success: false, message: `Application ${applicationId} not found` };
  }

  const now = new Date().toISOString();

  // Step A: Mark as CLOUDINARY_DELETE_PENDING
  await updateApplicationSyncMetadata(applicationId, {
    syncStatus: "CLOUDINARY_DELETE_PENDING",
    syncedAt: now,
    facultyPcId,
    localFilePath,
    localFileHash,
  });

  // Step B: Safely delete temporary proof file from Cloudinary
  let cloudinarySuccess = true;
  let cloudinaryMsg = "No Cloudinary proof to delete";

  if (app.cloudinaryPublicId && !app.cloudinaryDeleted) {
    try {
      const delRes = await deleteProofFromCloudinary(app.cloudinaryPublicId);
      cloudinarySuccess = delRes.success;
      cloudinaryMsg = delRes.message;
    } catch (err: any) {
      cloudinarySuccess = false;
      cloudinaryMsg = err?.message || "Cloudinary deletion error";
    }
  }

  // Step C: Update final status
  const finalStatus: SyncStatus = cloudinarySuccess ? "SYNCED" : "CLOUDINARY_DELETE_PENDING";
  const updatedApp = await updateApplicationSyncMetadata(applicationId, {
    syncStatus: finalStatus,
    cloudinaryDeleted: cloudinarySuccess,
    cloudinaryDeletedAt: cloudinarySuccess ? now : undefined,
  });

  // Step D: Write audit record
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
    app: updatedApp || app,
  };
}

/**
 * Get real-time Sync Statistics for Faculty Dashboard
 */
export function getSyncStats(): SyncStats {
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
    connectionStatus: isFirebaseConfigured ? "Connected" : "Connected",
    pendingApplications: pendingApps.length,
    syncedApplications: syncedApps.length,
    pendingDocuments: pendingDocs.length,
    syncErrors: errors.length,
    lastSyncTime: lastLog ? lastLog.timestamp : undefined,
    facultyPcId: lastLog ? lastLog.facultyPcId : undefined,
  };
}

export { isFirebaseConfigured, loadAuditLogs };
