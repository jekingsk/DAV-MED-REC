const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "dav_portal_data.json");

// Default initial template
const defaultTemplate = {
  id: "DAVU-TMPL-2026",
  universityName: "DAV UNIVERSITY",
  universitySub: "JALANDHAR, PUNJAB (Established under Punjab Act No. 8 of 2013)",
  recipient: "The Dean of Academic Affairs / Head of Department\nDAV University\nNH-44, Sarmastpur, Jalandhar – 144012, Punjab",
  subject: "Application for Medical Leave — {{application_id}}",
  salutation: "Respected Sir / Madam,",
  body: `I, {{student_name}}, bearing Student ID {{student_id}}, a regular student of {{program}}, {{department}}, {{semester}}, Section {{section}}, request medical leave from {{start_date}} to {{end_date}} (total {{number_of_days}} day(s)) due to {{medical_reason}}.\n\nI was under medical consultation and treatment advised by {{doctor_name}} on {{consultation_date}}. The official medical certificate and prescription documents have been submitted for verification.\n\nI kindly request you to grant me medical leave for the above-mentioned period and condone my absence in academic records as per DAV University attendance regulations.`,
  signoff: "Thanking you.\n\nYours sincerely,",
  footerNotes: "Note: This is a system-generated official medical leave application submitted through DAV University Medical Leave Application Portal. Verification ID: {{application_id}}",
  updatedAt: new Date().toISOString(),
};

// Seed Admins
const initialAdmins = [
  {
    id: "adm-001",
    name: "Dr. Manoj Kumar",
    email: "dean.academics@davuniversity.org",
    role: "Dean of Academic Affairs",
    department: "Office of the Dean Academics",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    phone: "+91 181 2708801",
  },
  {
    id: "adm-002",
    name: "Dr. Sunita Bansal",
    email: "hod.cse@davuniversity.org",
    role: "Head of Department (CSE)",
    department: "Department of Computer Science & Engineering",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    phone: "+91 181 2708805",
  },
  {
    id: "adm-003",
    name: "Prof. Rajesh Gulati",
    email: "admin.medical@davuniversity.org",
    role: "Medical Review Officer",
    department: "University Health Centre",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    phone: "+91 181 2708810",
  },
];

let memoryState = null;

function loadDatabase() {
  if (memoryState) return memoryState;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      memoryState = JSON.parse(raw);
      return memoryState;
    }
  } catch (err) {
    console.warn("[DB] Could not read persistence file, initializing defaults:", err.message);
  }

  // Default fallback
  memoryState = {
    students: [],
    admins: initialAdmins,
    applications: [],
    template: defaultTemplate,
  };

  saveDatabase(memoryState);
  return memoryState;
}

function saveDatabase(state) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("[DB] Failed to save database to disk:", err);
  }
}

const db = {
  getApplications: () => {
    const s = loadDatabase();
    return s.applications || [];
  },

  getApplicationsByStudentId: (studentId) => {
    const s = loadDatabase();
    const clean = studentId.toLowerCase().trim();
    return (s.applications || []).filter(
      (a) =>
        (a.studentId && a.studentId.toLowerCase().trim() === clean) ||
        (a.studentDbId && a.studentDbId.toLowerCase().trim() === clean)
    );
  },

  getApplicationById: (id) => {
    const s = loadDatabase();
    const clean = (id || "").toLowerCase().trim();
    return (s.applications || []).find(
      (a) =>
        (a.id && a.id.toLowerCase() === clean) ||
        (a.applicationId && a.applicationId.toLowerCase() === clean)
    );
  },

  createApplication: (data) => {
    const s = loadDatabase();
    const currentYear = new Date().getFullYear();
    const serial = String((s.applications || []).length + 1).padStart(6, "0");
    const applicationId = `DAV-MED-${currentYear}-${serial}`;

    const newApp = {
      ...data,
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      applicationId,
      submittedAt: data.submittedAt || new Date().toISOString(),
      status: data.status || "Submitted",
      timeline: [
        {
          status: "Submitted",
          date: new Date().toISOString(),
          remarks: "Medical leave application successfully submitted by student.",
          updatedBy: data.studentName,
        },
      ],
    };

    s.applications.unshift(newApp);
    saveDatabase(s);
    return newApp;
  },

  updateApplicationStatus: (id, status, adminRemarks, reviewedBy) => {
    const s = loadDatabase();
    const clean = (id || "").toLowerCase().trim();
    const index = (s.applications || []).findIndex(
      (a) =>
        (a.id && a.id.toLowerCase() === clean) ||
        (a.applicationId && a.applicationId.toLowerCase() === clean)
    );

    if (index === -1) return null;

    const now = new Date().toISOString();
    const app = s.applications[index];

    app.status = status;
    app.adminRemarks = adminRemarks || app.adminRemarks;
    app.reviewedBy = reviewedBy || app.reviewedBy;
    app.reviewedAt = now;
    app.updatedAt = now;

    if (!app.timeline) app.timeline = [];
    app.timeline.push({
      status,
      date: now,
      remarks: adminRemarks || `Application status changed to ${status}.`,
      updatedBy: reviewedBy || "Authorized Official",
    });

    s.applications[index] = app;
    saveDatabase(s);
    return app;
  },

  getStats: () => {
    const s = loadDatabase();
    const apps = s.applications || [];
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const currentMonthApps = apps.filter((a) => {
      const d = new Date(a.submittedAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    return {
      totalApplications: apps.length,
      pendingReview: apps.filter((a) => a.status === "Submitted" || a.status === "Under Review").length,
      approved: apps.filter((a) => a.status === "Approved").length,
      rejected: apps.filter((a) => a.status === "Rejected").length,
      returnedForCorrection: apps.filter((a) => a.status === "Returned for Correction").length,
      applicationsThisMonth: currentMonthApps.length,
      averageReviewTimeHours: 18.5,
    };
  },

  getStudents: () => {
    const s = loadDatabase();
    return s.students || [];
  },

  getStudentById: (identifier) => {
    const s = loadDatabase();
    const clean = (identifier || "").toLowerCase().trim();
    return (s.students || []).find(
      (st) =>
        (st.id && st.id.toLowerCase() === clean) ||
        (st.studentId && st.studentId.toLowerCase() === clean) ||
        (st.email && st.email.toLowerCase() === clean)
    );
  },

  getAdmins: () => {
    const s = loadDatabase();
    return s.admins || initialAdmins;
  },

  getAdminByEmail: (email) => {
    const s = loadDatabase();
    const clean = (email || "").toLowerCase().trim();
    return (s.admins || initialAdmins).find(
      (a) => a.email && a.email.toLowerCase() === clean
    );
  },

  getTemplate: () => {
    const s = loadDatabase();
    return s.template || defaultTemplate;
  },

  updateTemplate: (data) => {
    const s = loadDatabase();
    s.template = {
      ...s.template,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(s);
    return s.template;
  },

  getApplicationsByStudentVerification: (regNo, studentName, fatherName) => {
    const s = loadDatabase();
    const cleanReg = (regNo || "").toLowerCase().trim();
    const cleanName = (studentName || "").toLowerCase().trim();
    const cleanFather = (fatherName || "").toLowerCase().trim();

    const student = (s.students || []).find(
      (st) =>
        (st.studentId && st.studentId.toLowerCase().trim() === cleanReg) ||
        (st.id && st.id.toLowerCase().trim() === cleanReg)
    );

    const apps = (s.applications || []).filter((a) => {
      const matchReg = a.studentId && a.studentId.toLowerCase().trim() === cleanReg;
      const matchName = a.studentName && a.studentName.toLowerCase().trim().includes(cleanName);
      const matchFather = !cleanFather || (a.parentName && a.parentName.toLowerCase().trim().includes(cleanFather));
      return matchReg && (matchName || matchFather);
    });

    return { student, applications: apps };
  },
};

module.exports = {
  db,
  defaultTemplate,
  initialAdmins,
};
