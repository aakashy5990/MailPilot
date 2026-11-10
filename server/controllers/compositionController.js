
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

    const composition = await EmailComposition.findOneAndUpdate(
      { userId: req.user._id },
      { $set: compositionData, $setOnInsert: { userId: req.user._id } },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

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
    await EmailComposition.findOneAndDelete({
      userId: req.user._id,
    });

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
