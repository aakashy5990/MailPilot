
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
} = require("../controllers/templateController");

// Create a template (Login required)
router.post("/", protect, createTemplate);

// Get all templates of logged-in user
router.get("/", protect, getTemplates);

// Update an existing template
router.put("/:id", protect, updateTemplate);

// Delete an existing template
router.delete("/:id", protect, deleteTemplate);

module.exports = router;
