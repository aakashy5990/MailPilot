const express = require("express");
const router = express.Router();
const { upload, validateAttachments } = require("../middleware/uploadMiddleware");

const protect = require("../middleware/authMiddleware");
const {
  connectGmail,
  handleGmailCallback,
  getConnectedGmail,
  sendEmail,
  sendBulkEmail,
  getEmailHistory,
  getEmailDetails,
  disconnectGmail,
} = require("../controllers/gmailController");

// Only logged-in users can connect Gmail
router.get("/connect", protect, connectGmail);
router.get("/callback", handleGmailCallback);
router.get("/accounts", protect, getConnectedGmail);
// Disconnect a connected Gmail account
router.delete("/:id", protect, disconnectGmail);
router.post(
  "/send",
  protect,
  upload.array("attachments", 5),
  validateAttachments,
  sendEmail
);
// Send bulk emails
router.post(
  "/bulk-send",
  protect,
  upload.array("attachments", 5),
  validateAttachments,
  sendBulkEmail
);
// Get email history of logged-in user
router.get("/history", protect, getEmailHistory);
router.get("/history/:id", protect, getEmailDetails);

module.exports = router;
