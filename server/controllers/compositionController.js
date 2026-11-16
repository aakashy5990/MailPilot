const EmailComposition = require("../models/EmailComposition");

// GET: Fetch the logged-in user's saved composition
const getComposition = async (req, res) => {
  try {
    const composition = await EmailComposition.findOne({
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      composition,
    });
  } catch (error) {
    console.error("Get composition error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load saved composition.",
    });
  }
};

// PUT: Save or update the logged-in user's composition

const saveComposition = async (req, res) => {
  try {
    const {
      version,
      emailMode,
      accountId,
      recipient,
      bulkRecipients,
      recipientMode,
      personalizedRecipients,
      subject,
      message,
    } = req.body;

    const compositionData = {
      emailMode,
      accountId,
      recipient,
      bulkRecipients,
      recipientMode,
      personalizedRecipients,
      subject,
      message,
    };

    // Check whether a draft already exists
    const existingComposition = await EmailComposition.findOne({
      userId: req.user._id,
    });

    // Create the first draft
    if (!existingComposition) {
      if (version !== 0) {
        return res.status(409).json({
          success: false,
          message: "Draft conflict. Please reload the latest draft.",
        });
      }

      const composition = await EmailComposition.create({
        userId: req.user._id,
        ...compositionData,
        version: 1,
      });

      return res.status(200).json({
        success: true,
        message: "Composition saved successfully.",
        composition,
      });
    }

    // Update only if the client's version matches the database
    const composition = await EmailComposition.findOneAndUpdate(
      {
        userId: req.user._id,
        version,
      },
      {
        $set: compositionData,
        $inc: { version: 1 },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    // Version mismatch means another tab saved first
    if (!composition) {
      return res.status(409).json({
        success: false,
        message: "Draft conflict. Another tab has updated this draft.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Composition saved successfully.",
      composition,
    });
  } catch (error) {
    console.error("Save composition error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save composition.",
    });
  }
};

// DELETE: Clear the saved composition after successful sending

const clearComposition = async (req, res) => {
  try {
    const version = Number(req.body?.version);

    // Require a valid draft version
    if (
      !Number.isSafeInteger(version) ||
      version < 0 ||
      req.body?.version === undefined ||
      req.body?.version === null
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid draft version is required.",
      });
    }

    // Delete only when the version matches
    const deletedComposition = await EmailComposition.findOneAndDelete({
      userId: req.user._id,
      version,
    });

    if (!deletedComposition) {
      const currentComposition = await EmailComposition.findOne({
        userId: req.user._id,
      });

      // No draft exists, so there is nothing to delete.
      if (!currentComposition) {
        return res.status(200).json({
          success: true,
          message: "No saved draft exists.",
        });
      }

      // A draft exists, but its version is different.
      return res.status(409).json({
        success: false,
        message:
          "Draft conflict. This draft may have been updated in another tab.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Saved composition cleared successfully.",
    });
  } catch (error) {
    console.error("Clear composition error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to clear saved composition.",
    });
  }
};

module.exports = {
  getComposition,
  saveComposition,
  clearComposition,
};
