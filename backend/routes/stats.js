const express = require("express");
const router = express.Router();
const { db } = require("../services/db");

// GET /api/stats
router.get("/", (req, res) => {
  try {
    const stats = db.getStats();
    const apps = db.getApplications();

    // Department breakdown
    const departmentCounts = {};
    apps.forEach((a) => {
      const dept = a.department || "Other";
      if (!departmentCounts[dept]) {
        departmentCounts[dept] = { total: 0, approved: 0, rejected: 0, pending: 0 };
      }
      departmentCounts[dept].total += 1;
      if (a.status === "Approved") departmentCounts[dept].approved += 1;
      else if (a.status === "Rejected") departmentCounts[dept].rejected += 1;
      else departmentCounts[dept].pending += 1;
    });

    // Semester breakdown
    const semesterCounts = {};
    apps.forEach((a) => {
      const sem = a.semester || "Unknown";
      semesterCounts[sem] = (semesterCounts[sem] || 0) + 1;
    });

    // Monthly breakdown (last 6 months)
    const monthCounts = {};
    apps.forEach((a) => {
      const date = new Date(a.submittedAt);
      const key = date.toLocaleString("en-US", { month: "short", year: "numeric" });
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });

    return res.json({
      success: true,
      stats,
      departmentBreakdown: departmentCounts,
      semesterBreakdown: semesterCounts,
      monthlyBreakdown: monthCounts,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to load portal statistics",
    });
  }
});

module.exports = router;
