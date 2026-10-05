const express = require("express");
const router = express.Router();
const { db } = require("../services/db");
const { uploadProofToCloudinary } = require("../services/cloudinary");
const {
  saveApplicationToFirebase,
  getApplicationsFromFirestore,
} = require("../services/firebase");

// GET /api/applications
router.get("/", async (req, res) => {
  try {
    const studentId = req.query.studentId;
    const status = req.query.status;
    const department = req.query.department;
    const semester = req.query.semester;
    const query = req.query.q;

    // Fetch from Firestore and Local DB
    const firestoreApps = await getApplicationsFromFirestore();
    let localApps = studentId
      ? db.getApplicationsByStudentId(studentId)
      : db.getApplications();

    // Merge Firestore documents with local records
    const map = new Map();
    for (const app of localApps) {
      const key = app.applicationId || app.id;
      map.set(key, {
        ...app,
        medicalProofUrl: app.medicalProofUrl || app.cloudinaryUrl || app.medicalCertificateUrl,
      });
    }

    for (const fApp of firestoreApps) {
      const key = fApp.applicationId || fApp.id;
      const existing = map.get(key);
      map.set(key, {
        ...(existing || {}),
        ...fApp,
        medicalProofUrl: fApp.medicalProofUrl || fApp.cloudinaryUrl || fApp.medicalCertificateUrl,
      });
    }

    let apps = Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    if (studentId) {
      const cleanSid = studentId.toLowerCase();
      apps = apps.filter(
        (a) =>
          (a.studentId && a.studentId.toLowerCase() === cleanSid) ||
          a.studentDbId === studentId
      );
    }

    if (status && status !== "All") {
      apps = apps.filter((a) => a.status && a.status.toLowerCase() === status.toLowerCase());
    }

    if (department && department !== "All") {
      apps = apps.filter((a) => a.department && a.department.toLowerCase() === department.toLowerCase());
    }

    if (semester && semester !== "All") {
      apps = apps.filter((a) => a.semester && a.semester.toLowerCase() === semester.toLowerCase());
    }

    if (query) {
      const q = query.toLowerCase();
      apps = apps.filter(
        (a) =>
          (a.applicationId && a.applicationId.toLowerCase().includes(q)) ||
          (a.studentName && a.studentName.toLowerCase().includes(q)) ||
          (a.studentId && a.studentId.toLowerCase().includes(q)) ||
          (a.reason && a.reason.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, applications: apps });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to fetch applications",
    });
  }
});

// GET /api/applications/:id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let application = db.getApplicationById(id);

    if (!application) {
      const fsApps = await getApplicationsFromFirestore();
      application = fsApps.find(
        (a) =>
          a.id === id || (a.applicationId && a.applicationId.toLowerCase() === id.toLowerCase())
      );
    }

    if (!application) {
      return res.status(404).json({
        error: `Application not found for ID: ${id}`,
      });
    }

    application = {
      ...application,
      medicalProofUrl:
        application.medicalProofUrl ||
        application.cloudinaryUrl ||
        application.medicalCertificateUrl,
    };

    return res.json({ success: true, application });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to retrieve application",
    });
  }
});

// POST /api/applications
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    if (!body.studentName?.trim()) {
      return res.status(400).json({ error: "Please enter your Full Name." });
    }
    if (!body.studentId?.trim()) {
      return res.status(400).json({ error: "Please enter your Student ID." });
    }
    if (!body.email?.trim() || !body.email.includes("@")) {
      return res.status(400).json({ error: "Please enter a valid university email address." });
    }
    if (!body.phone?.trim() || body.phone.length < 10) {
      return res.status(400).json({ error: "Please enter a valid mobile contact number." });
    }
    if (!body.parentName?.trim()) {
      return res.status(400).json({ error: "Please enter your Father's Name as per university records." });
    }
    if (!body.startDate) {
      return res.status(400).json({ error: "Please select leave start date." });
    }
    if (!body.endDate) {
      return res.status(400).json({ error: "Please select leave end date." });
    }

    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format provided." });
    }

    if (end < start) {
      return res.status(400).json({ error: "End date cannot be earlier than start date." });
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (!body.reason?.trim() || body.reason.length < 5) {
      return res.status(400).json({ error: "Please provide a detailed medical reason for leave." });
    }
    if (!body.doctorName?.trim()) {
      return res.status(400).json({ error: "Please enter the consulting Doctor or Hospital name." });
    }
    if (!body.consultationDate) {
      return res.status(400).json({ error: "Please provide the medical consultation date." });
    }
    if (!body.medicalCertificateUrl) {
      return res.status(400).json({ error: "Please upload your medical certificate document (PDF, JPG, PNG)." });
    }
    if (!body.declarationAccepted) {
      return res.status(400).json({ error: "You must accept the truthfulness declaration before submitting." });
    }

    let cloudinaryDetails = {};
    const tempAppId = `DAV-MED-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    if (body.medicalCertificateUrl) {
      try {
        const uploadRes = await uploadProofToCloudinary(
          body.medicalCertificateUrl,
          body.medicalCertificateName || "Medical_Certificate.pdf",
          tempAppId
        );
        cloudinaryDetails = {
          publicId: uploadRes.publicId,
          url: uploadRes.secureUrl || uploadRes.url,
          resourceType: uploadRes.resourceType,
          originalName: uploadRes.originalName,
          uploadedAt: uploadRes.uploadedAt,
        };
      } catch (uploadErr) {
        console.warn("[Applications] Cloudinary upload failed, keeping original document reference:", uploadErr.message);
      }
    }

    const application = db.createApplication({
      studentDbId: body.studentDbId || "std-external",
      studentId: body.studentId.trim(),
      studentName: body.studentName.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      program: body.program || "Bachelor of Technology",
      department: body.department || "School of Engineering & Technology",
      semester: body.semester || "1st Semester",
      section: body.section || "A",
      academicSession: body.academicSession || "2026-2027",
      parentName: body.parentName?.trim() || "",
      leaveType: "Medical Leave",
      startDate: body.startDate,
      endDate: body.endDate,
      numberOfDays,
      reason: body.reason.trim(),
      applicationDate: body.applicationDate || new Date().toISOString().split("T")[0],
      doctorName: body.doctorName.trim(),
      consultationDate: body.consultationDate,
      treatmentDetails: body.treatmentDetails?.trim() || "",
      medicalCertificateName: body.medicalCertificateName || "Medical_Certificate.pdf",
      medicalCertificateUrl: cloudinaryDetails.url || body.medicalCertificateUrl,
      medicalProofUrl: cloudinaryDetails.url || body.medicalCertificateUrl,
      medicalCertificateSize: body.medicalCertificateSize || "300 KB",
      declarationAccepted: true,
      status: "Submitted",
      adminRemarks: "",

      syncStatus: "PENDING_SYNC",
      cloudinaryPublicId: cloudinaryDetails.publicId,
      cloudinaryUrl: cloudinaryDetails.url,
      cloudinaryResourceType: cloudinaryDetails.resourceType,
      cloudinaryOriginalName: cloudinaryDetails.originalName,
      cloudinaryUploadedAt: cloudinaryDetails.uploadedAt,
      cloudinaryDeleted: false,

      submittedAt: new Date().toISOString(),
    });

    await saveApplicationToFirebase(application);

    return res.json({
      success: true,
      application,
      message: "Medical leave application submitted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to submit medical leave application",
    });
  }
});

// PATCH /api/applications/:id
router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status, adminRemarks, reviewedBy } = req.body;

    if (!status) {
      return res.status(400).json({ error: "New status is required." });
    }

    if (
      (status === "Reject" ||
        status === "Rejected" ||
        status === "Returned for Correction") &&
      (!adminRemarks || !adminRemarks.trim())
    ) {
      return res.status(400).json({
        error: "University policy requires official remarks/reason when rejecting or returning an application.",
      });
    }

    const normalizedStatus =
      status === "Approve" ? "Approved" : status === "Reject" ? "Rejected" : status;

    const updated = db.updateApplicationStatus(
      id,
      normalizedStatus,
      adminRemarks?.trim() || "",
      reviewedBy || "Authorized University Faculty/Admin"
    );

    if (!updated) {
      return res.status(404).json({ error: "Application not found to update." });
    }

    return res.json({
      success: true,
      application: updated,
      message: `Application status updated to ${normalizedStatus}.`,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to update application",
    });
  }
});

module.exports = router;
