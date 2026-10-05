const express = require("express");
const router = express.Router();
const { db } = require("../services/db");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        error: "Please enter your University Email or ID and Password.",
      });
    }

    if (role === "admin") {
      const admin = db.getAdminByEmail(identifier);
      if (!admin) {
        return res.status(401).json({
          error: "No administrator account found with this email.",
        });
      }
      return res.json({
        success: true,
        user: admin,
        role: "admin",
      });
    } else {
      const student = db.getStudentById(identifier);
      if (!student) {
        return res.status(401).json({
          error: "No student found with this University Email or Student ID.",
        });
      }
      return res.json({
        success: true,
        user: student,
        role: "student",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Authentication failed",
    });
  }
});

module.exports = router;
