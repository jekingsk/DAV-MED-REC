export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Returned for Correction";

export interface TimelineEvent {
  id: string;
  status: ApplicationStatus;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  remarks?: string;
}

export interface StudentProfile {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  department: string;
  semester: string;
  section: string;
  academicSession: string;
  parentName: string;
  avatar?: string;
  createdAt: string;
}

export interface MedicalLeaveApplication {
  id: string;
  applicationId: string;
  studentDbId: string;
  studentId: string;
  studentName: string;
  email: string;
  phone: string;
  program: string;
  department: string;
  semester: string;
  section: string;
  academicSession: string;
  parentName?: string;
  
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  applicationDate: string;

  doctorName: string;
  consultationDate: string;
  treatmentDetails?: string;
  medicalCertificateName?: string;
  medicalCertificateUrl?: string; // base64 or storage url
  medicalProofUrl?: string; // Cloudinary or storage URL for medical proof document
  medicalCertificateSize?: string;
  
  declarationAccepted: boolean;
  status: ApplicationStatus;
  adminRemarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;

  // Firebase & Faculty PC Synchronization Fields
  syncStatus?: SyncStatus;
  syncedAt?: string;
  facultyPcId?: string;
  localFilePath?: string;
  localFileHash?: string;
  // Local Admin PC Proof Storage Fields
  localProofFilename?: string;
  localProofPath?: string;
  localProofStored?: boolean;
  localProofStoredAt?: string;
  cloudinaryDeleted?: boolean;
  cloudinaryDeletedAt?: string;

  // Cloudinary Proof Storage Fields (Temporary Storage)
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  cloudinaryResourceType?: string;
  cloudinaryOriginalName?: string;
  cloudinaryUploadedAt?: string;

  // Application PDF Document
  applicationPdfUrl?: string;
  applicationPdfGenerated?: boolean;

  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

export type SyncStatus =
  | "PENDING_SYNC"
  | "SYNCING"
  | "SYNCED"
  | "SYNC_FAILED"
  | "CLOUDINARY_DELETE_PENDING"
  | "CLOUDINARY_DELETED";

export interface SyncStats {
  connectionStatus: "Connected" | "Disconnected" | "Syncing" | "Standby";
  pendingApplications: number;
  syncedApplications: number;
  pendingDocuments: number;
  syncErrors: number;
  lastSyncTime?: string;
  facultyPcId?: string;
}

export interface SyncAuditRecord {
  id: string;
  applicationId: string;
  action: "DOWNLOAD" | "VERIFY" | "CLOUDINARY_DELETE" | "ERROR";
  facultyPcId: string;
  status: "SUCCESS" | "FAILED";
  details: string;
  timestamp: string;
  fileHash?: string;
  filePath?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "Dean of Academic Affairs" | "Head of Department" | "University Medical Officer" | "Registrar";
  department: string;
  avatar?: string;
}

export interface TemplateConfig {
  id: string;
  universityName: string;
  universitySub: string;
  recipient: string;
  subject: string;
  salutation: string;
  body: string;
  signoff: string;
  footerNotes: string;
  updatedAt: string;
}

export interface PortalStats {
  totalApplications: number;
  pendingReview: number;
  underReview: number;
  approved: number;
  rejected: number;
  returnedForCorrection: number;
  applicationsThisMonth: number;
  avgLeaveDuration: number;
  approvedRate: number;
}

export interface AdminDownloadedProofRecord {
  applicationId: string;
  cloudinaryPublicId: string;
  downloadedAt: string;
  downloaded: boolean;
  cloudinaryDeleted: boolean;
  cloudinaryDeletedAt?: string;
  filename?: string;
}
