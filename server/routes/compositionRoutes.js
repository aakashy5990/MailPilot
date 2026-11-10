
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getComposition,
  saveComposition,
  clearComposition,
} = require("../controllers/compositionController");

// Get saved composition
router.get("/", protect, getComposition);

// Save or update composition
router.put("/", protect, saveComposition);

// Clear saved composition
router.delete("/", protect, clearComposition);

module.exports = router;
