const express = require("express");
const router = express.Router();
const { db } = require("../services/db");

// GET /api/students
router.get("/", (req, res) => {
  try {
    const students = db.getStudents();
    const apps = db.getApplications();

    const studentData = students.map((s) => {
      const studentApps = apps.filter(
        (a) =>
          (a.studentId && a.studentId.toLowerCase() === s.studentId.toLowerCase()) ||
          a.studentDbId === s.id
      );
      const totalLeaves = studentApps.reduce(
        (acc, a) => acc + (a.status === "Approved" ? a.numberOfDays : 0),
        0
      );
      return {
        ...s,
        totalApplications: studentApps.length,
        approvedApplications: studentApps.filter((a) => a.status === "Approved").length,
        totalApprovedDays: totalLeaves,
        latestStatus: studentApps[0]?.status || "None",
      };
    });

    return res.json({ success: true, students: studentData });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to load students",
    });
  }
});

module.exports = router;
