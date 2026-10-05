import fs from "fs";
import path from "path";
import {
  MedicalLeaveApplication,
  StudentProfile,
  AdminUser,
  TemplateConfig,
  PortalStats,
  ApplicationStatus,
} from "../types";
import {
  defaultTemplate,
  initialStudents,
  initialAdmins,
  initialApplications,
} from "./data";

export { defaultTemplate, initialStudents, initialAdmins, initialApplications };

// In-Memory & File Store Manager
interface DatabaseState {
  students: StudentProfile[];
  admins: AdminUser[];
  applications: MedicalLeaveApplication[];
  template: TemplateConfig;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "dav_portal_data.json");

let memoryState: DatabaseState | null = null;

function loadDatabase(): DatabaseState {
  if (memoryState) return memoryState;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      memoryState = JSON.parse(raw);
      return memoryState!;
    }
  } catch (err) {
    console.warn("Could not read persistence file, initializing defaults:", err);
  }

  // Initialize with seed data
  memoryState = {
    students: initialStudents,
    admins: initialAdmins,
    applications: initialApplications,
    template: defaultTemplate,
  };

  saveDatabase(memoryState);
  return memoryState;
}

function saveDatabase(state: DatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist database to disk:", err);
  }
}

// Database helper API methods
export const db = {
  getStudents: (): StudentProfile[] => {
    return loadDatabase().students;
  },

  getStudentById: (id: string): StudentProfile | undefined => {
    return loadDatabase().students.find(
      (s) =>
        s.id === id ||
        s.studentId.toLowerCase() === id.toLowerCase() ||
        s.email.toLowerCase() === id.toLowerCase()
    );
  },

  getAdmins: (): AdminUser[] => {
    return loadDatabase().admins;
  },

  getAdminByEmail: (email: string): AdminUser | undefined => {
    return loadDatabase().admins.find(
      (a) => a.email.toLowerCase() === email.toLowerCase()
    );
  },

  getApplications: (): MedicalLeaveApplication[] => {
    const data = loadDatabase();
    return [...data.applications].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  },

  getApplicationById: (idOrAppId: string): MedicalLeaveApplication | undefined => {
    return loadDatabase().applications.find(
      (app) =>
        app.id === idOrAppId ||
        app.applicationId.toLowerCase() === idOrAppId.toLowerCase().trim()
    );
  },

  getApplicationsByStudentId: (studentId: string): MedicalLeaveApplication[] => {
    return loadDatabase()
      .applications.filter(
        (app) =>
          app.studentId.toLowerCase() === studentId.toLowerCase() ||
          app.studentDbId === studentId
      )
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  },

  getApplicationsByStudentVerification: (
    registrationNo: string,
    studentName: string,
    fatherName: string
  ): { applications: MedicalLeaveApplication[]; student?: StudentProfile } => {
    const cleanStr = (s: string) =>
      s
        .toLowerCase()
        .replace(/^(sh\.|shri|mr\.|mr|dr\.|dr|s\.|sardar|smt\.)\s+/i, "")
        .replace(/[^a-z0-9]/g, "");

    const normReg = cleanStr(registrationNo);
    const normName = cleanStr(studentName);
    const normFather = cleanStr(fatherName);

    const state = loadDatabase();

    // Find student in directory if registered
    const student = state.students.find((s) => {
      const sReg = cleanStr(s.studentId);
      const sName = cleanStr(s.name);
      const sFather = cleanStr(s.parentName || "");
      return sReg === normReg && (sName.includes(normName) || normName.includes(sName)) && (sFather.includes(normFather) || normFather.includes(sFather));
    });

    // Find all applications matching this student's registration number and father's name
    const apps = state.applications.filter((app) => {
      const aReg = cleanStr(app.studentId);
      const aName = cleanStr(app.studentName);
      const aFather = cleanStr(app.parentName || (student?.parentName || ""));

      const matchReg = aReg === normReg;
      const matchName = aName.includes(normName) || normName.includes(aName);
      const matchFather =
        !normFather ||
        !aFather ||
        aFather.includes(normFather) ||
        normFather.includes(aFather);

      return matchReg && matchName && matchFather;
    });

    return {
      applications: apps.sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      ),
      student: student || (apps[0] ? {
        id: apps[0].studentDbId || "std-guest",
        studentId: apps[0].studentId,
        name: apps[0].studentName,
        email: apps[0].email,
        phone: apps[0].phone,
        program: apps[0].program,
        department: apps[0].department,
        semester: apps[0].semester,
        section: apps[0].section,
        academicSession: apps[0].academicSession,
        parentName: apps[0].parentName || fatherName,
        createdAt: apps[0].submittedAt,
      } : undefined),
    };
  },

  createApplication: (
    appData: Omit<
      MedicalLeaveApplication,
      "id" | "applicationId" | "createdAt" | "updatedAt" | "timeline"
    >
  ): MedicalLeaveApplication => {
    const state = loadDatabase();
    const currentYear = new Date().getFullYear();
    const counter = state.applications.length + 101;
    const applicationId = `DAV-MED-${currentYear}-${String(counter).padStart(6, "0")}`;
    const now = new Date().toISOString();

    const newApp: MedicalLeaveApplication = {
      ...appData,
      id: `app-${Date.now()}`,
      applicationId,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          id: `t-${Date.now()}`,
          status: "Submitted",
          title: "Application Submitted Online",
          description: `Medical leave application submitted by ${appData.studentName} (${appData.studentId}).`,
          timestamp: now,
          actor: `${appData.studentName} (Student)`,
        },
      ],
    };

    state.applications.unshift(newApp);
    saveDatabase(state);
    return newApp;
  },

  updateApplicationStatus: (
    idOrAppId: string,
    status: ApplicationStatus,
    adminRemarks: string,
    reviewedBy: string
  ): MedicalLeaveApplication | null => {
    const state = loadDatabase();
    const appIndex = state.applications.findIndex(
      (a) => a.id === idOrAppId || a.applicationId.toLowerCase() === idOrAppId.toLowerCase()
    );

    if (appIndex === -1) return null;

    const app = state.applications[appIndex];
    const now = new Date().toISOString();

    app.status = status;
    app.adminRemarks = adminRemarks;
    app.reviewedBy = reviewedBy;
    app.reviewedAt = now;
    app.updatedAt = now;

    let statusTitle = `Status updated to ${status}`;
    let statusDesc = adminRemarks || `Application status changed to ${status}.`;

    if (status === "Approved") {
      statusTitle = "Medical Leave Sanctioned / Approved";
      statusDesc = adminRemarks || "Application verified and approved by university authority.";
    } else if (status === "Rejected") {
      statusTitle = "Application Rejected";
      statusDesc = adminRemarks || "Application did not meet university medical leave criteria.";
    } else if (status === "Returned for Correction") {
      statusTitle = "Returned to Student for Document Correction";
      statusDesc = adminRemarks || "Additional documentation or clarification requested.";
    } else if (status === "Under Review") {
      statusTitle = "Application Marked Under Clinical Review";
      statusDesc = adminRemarks || "Under evaluation by Medical Committee / HOD.";
    }

    app.timeline.push({
      id: `t-${Date.now()}`,
      status,
      title: statusTitle,
      description: statusDesc,
      timestamp: now,
      actor: reviewedBy,
      remarks: adminRemarks,
    });

    saveDatabase(state);
    return app;
  },

  getTemplate: (): TemplateConfig => {
    return loadDatabase().template;
  },

  updateTemplate: (updates: Partial<TemplateConfig>): TemplateConfig => {
    const state = loadDatabase();
    state.template = {
      ...state.template,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(state);
    return state.template;
  },

  getStats: (): PortalStats => {
    const apps = loadDatabase().applications;
    const total = apps.length;
    const pending = apps.filter((a) => a.status === "Submitted").length;
    const underReview = apps.filter((a) => a.status === "Under Review").length;
    const approved = apps.filter((a) => a.status === "Approved").length;
    const rejected = apps.filter((a) => a.status === "Rejected").length;
    const returned = apps.filter((a) => a.status === "Returned for Correction").length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonth = apps.filter((a) => {
      const d = new Date(a.submittedAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const totalDays = apps.reduce((sum, a) => sum + (a.numberOfDays || 0), 0);
    const avgLeaveDuration = total > 0 ? Number((totalDays / total).toFixed(1)) : 0;
    const resolved = approved + rejected;
    const approvedRate = resolved > 0 ? Math.round((approved / resolved) * 100) : 0;

    return {
      totalApplications: total,
      pendingReview: pending,
      underReview,
      approved,
      rejected,
      returnedForCorrection: returned,
      applicationsThisMonth: thisMonth,
      avgLeaveDuration,
      approvedRate,
    };
  },
};
