const mongoose = require("mongoose");

const emailHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    gmailAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GmailAccount",
      required: true,
    },

    from: {
      type: String,
      required: true,
      lowercase: true,
    },

    to: {
      type: String,
      required: true,
      lowercase: true,
    },

    subject: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },

    messageId: {
      type: String,
      default: null,
    },

    attachments: {
      type: [
        {
          filename: {
            type: String,
            required: true,
          },
          size: {
            type: Number,
            required: true,
          },
          mimetype: {
            type: String,
            default: "application/octet-stream",
          },
        },
      ],
      default: [],
    },

    error: {
      type: String,
      default: null,
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const EmailHistory = mongoose.model("EmailHistory", emailHistorySchema);

module.exports = EmailHistory;
