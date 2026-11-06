
const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    // The user who owns this template
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Template name displayed in MailPilot
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Email subject
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // Email message body
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20000,
    },
  },
  {
    timestamps: true,
  }
);

// Export Template model
const Template = mongoose.model("Template", templateSchema);

module.exports = Template;
