
const Template = require("../models/Template");

// Create a new email template
const createTemplate = async (req, res) => {
  try {
    const { name, subject, message } = req.body;

    // Validate required fields
    if (!name || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, subject and message are required.",
      });
    }

    // Save template for the logged-in user
    const template = await Template.create({
      userId: req.user._id,
      name,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Template created successfully!",
      template,
    });
  } catch (error) {
    console.error("Create template error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create template.",
    });
  }
};

// Get templates belonging to the logged-in user
const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("Get templates error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch templates.",
    });
  }
};


// Update an existing email template
const updateTemplate = async (req, res) => {
  try {
    const { name, subject, message } = req.body;

    if (!name || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, subject and message are required.",
      });
    }

    // Find template belonging to the logged-in user
    const template = await Template.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      {
        name,
        subject,
        message,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Template updated successfully!",
      template,
    });
  } catch (error) {
    console.error("Update template error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update template.",
    });
  }
};


// Delete an existing email template
const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Template deleted successfully!",
    });
  } catch (error) {
    console.error("Delete template error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete template.",
    });
  }
};

module.exports = {
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
};
