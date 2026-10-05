const express = require("express");
const router = express.Router();
const { db } = require("../services/db");

// GET /api/template
router.get("/", (req, res) => {
  try {
    const template = db.getTemplate();
    return res.json({ success: true, template });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to load template",
    });
  }
});

// PUT /api/template
router.put("/", (req, res) => {
  try {
    const body = req.body;
    const updated = db.updateTemplate(body);
    return res.json({
      success: true,
      template: updated,
      message: "University medical leave template successfully updated.",
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to update template",
    });
  }
});

module.exports = router;
