const express = require("express");
const router = express.Router();
const { db } = require("../services/db");

// POST /api/track
router.post("/", (req, res) => {
  try {
    const body = req.body;

    // Mode 1: Student Identity Verification
    if (body.registrationNumber || body.studentName || body.fatherName) {
      const regNo = (body.registrationNumber || body.studentId || "").trim();
      const sName = (body.studentName || "").trim();
      const fName = (body.fatherName || "").trim();

      if (!regNo) {
        return res.status(400).json({
          error: "Please enter your Student Registration Number / Roll No.",
        });
      }
      if (!sName) {
        return res.status(400).json({
          error: "Please enter your Full Student Name.",
        });
      }
      if (!fName) {
        return res.status(400).json({
          error: "Please enter your Father's Name as per university records.",
        });
      }

      const result = db.getApplicationsByStudentVerification(regNo, sName, fName);

      if (!result.applications || result.applications.length === 0) {
        return res.status(404).json({
          error: `No medical leave applications found for Registration No "${regNo}" under student "${sName}" and Father's Name "${fName}". Please check your details or submit a new application.`,
        });
      }

      return res.json({
        success: true,
        mode: "student",
        student: result.student,
        applications: result.applications,
      });
    }

    // Mode 2: Direct Application ID Lookup
    const { applicationId, studentId } = body;

    if (!applicationId?.trim()) {
      return res.status(400).json({
        error: "Please provide either your Registration Number, Name and Father's Name, or an Application ID.",
      });
    }

    const app = db.getApplicationById(applicationId.trim());

    if (!app) {
      return res.status(404).json({
        error: `No medical leave record found matching "${applicationId}". Please verify your Application ID.`,
      });
    }

    if (
      studentId &&
      studentId.trim() &&
      app.studentId &&
      app.studentId.toLowerCase() !== studentId.trim().toLowerCase()
    ) {
      return res.status(400).json({
        error: "Student ID does not match the record on file for this Application ID.",
      });
    }

    return res.json({
      success: true,
      mode: "application",
      application: app,
      applications: [app],
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to track application",
    });
  }
});

module.exports = router;
