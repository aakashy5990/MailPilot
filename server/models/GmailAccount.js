
const mongoose = require("mongoose");

const gmailAccountSchema = new mongoose.Schema(
  {
    // MailPilot user who owns this Gmail account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Connected Gmail address
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    // Encrypted Google refresh token
    encryptedRefreshToken: {
      type: String,
      required: true
    },

    // Encryption IV
    iv: {
      type: String,
      required: true
    },

    // Encryption authentication tag
    authTag: {
      type: String,
      required: true
    },

    // Permissions granted by the user
    scopes: {
      type: [String],
      default: []
    },

    connectedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate Gmail connections for the same MailPilot user
gmailAccountSchema.index(
  { userId: 1, email: 1 },
  { unique: true }
);

const GmailAccount = mongoose.model(
  "GmailAccount",
  gmailAccountSchema
);

module.exports = GmailAccount;
