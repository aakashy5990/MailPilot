
const mongoose = require("mongoose");

const emailCompositionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    emailMode: {
      type: String,
      enum: ["single", "bulk"],
      default: "single",
    },

    accountId: {
      type: String,
      default: "",
    },

    recipient: {
      type: String,
      default: "",
    },

    bulkRecipients: {
      type: String,
      default: "",
    },

    recipientMode: {
      type: String,
      enum: ["manual", "csv"],
      default: "manual",
    },

    personalizedRecipients: {
      type: [
        {
          email: String,
          name: String,
        },
      ],
      default: [],
    },

    subject: {
      type: String,
      default: "",
    },

    message: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "EmailComposition",
  emailCompositionSchema
);
