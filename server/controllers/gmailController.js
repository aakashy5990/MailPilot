const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");

// const { SCOPES } = require("../config/google");
const { createOAuthClient, SCOPES } = require("../config/google");
const sendGmailMessage = require("../services/gmailSendService");
const User = require("../models/User");
const GmailAccount = require("../models/GmailAccount");

const { encryptToken, decryptToken } = require("../utils/tokenEncryption");
const validator = require("validator");

const fs = require("fs/promises");
const path = require("path");

const EmailHistory = require("../models/EmailHistory");


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 10 * 60 * 1000,
};

// STEP 1: Start Gmail connection
const connectGmail = async (req, res) => {
  try {
    const oauth2Client = createOAuthClient();

    // Create signed state linked to logged-in user
    const state = jwt.sign(
      {
        userId: req.user._id.toString(),
        nonce: crypto.randomBytes(32).toString("hex"),
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    res.cookie("oauth_state", state, cookieOptions);

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      state,
      prompt: "consent",
    });

    return res.redirect(authorizationUrl);
  } catch (error) {
    console.error("Gmail connection error:", error.message);

    return res.status(500).send("Unable to start Gmail connection.");
  }
};

// STEP 2: Handle Google's callback
const handleGmailCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).send("Google authorization was denied.");
    }

    // Compare state received from Google with our cookie
    const savedState = req.cookies.oauth_state;

    if (!state || !savedState || state !== savedState) {
      return res.status(403).send("Invalid OAuth state.");
    }

    res.clearCookie("oauth_state", cookieOptions);

    if (!code) {
      return res.status(400).send("Authorization code missing.");
    }

    // Verify signed state and get MailPilot user ID
    const decoded = jwt.verify(state, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).send("MailPilot user not found.");
    }

    // Exchange authorization code for Google tokens
    const oauth2Client = createOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.id_token) {
      return res.status(400).send("Google identity token missing.");
    }

    // Verify Google identity
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const googleUser = ticket.getPayload();

    if (!googleUser || !googleUser.email || !googleUser.email_verified) {
      return res.status(400).send("Unable to verify Gmail account.");
    }

    const email = googleUser.email.toLowerCase();

    // Find existing connection, if any
    const existingAccount = await GmailAccount.findOne({
      userId: user._id,
      email,
    });

    // Reuse existing refresh token if Google doesn't return a new one
    const refreshToken =
      tokens.refresh_token || (existingAccount ? null : null);

    if (!refreshToken && !existingAccount) {
      return res
        .status(400)
        .send("Refresh token missing. Please reconnect and grant consent.");
    }

    // Encrypt new refresh token, or preserve existing encrypted values
    let encryptedFields = {};

    if (refreshToken) {
      const encrypted = encryptToken(refreshToken);

      encryptedFields = {
        encryptedRefreshToken: encrypted.encryptedData,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      };
    }

    // Save Gmail account linked to the correct MailPilot user
    await GmailAccount.findOneAndUpdate(
      {
        userId: user._id,
        email,
      },
      {
        $set: {
          ...encryptedFields,
          scopes: tokens.scope ? tokens.scope.split(" ") : SCOPES,
          connectedAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );

    console.log("Gmail account connected successfully:", email);

    return res.redirect(
      `${process.env.CLIENT_URL}/dashboard?gmail=connected`
    );
  } catch (error) {
    console.error("Google callback error:", error.message);

    return res.status(500).send("Google authorization failed.");
  }
};

const getConnectedGmail = async (req, res) => {
  try {
    const accounts = await GmailAccount.find({
      userId: req.user._id,
    }).select("email scopes connectedAt");

    return res.status(200).json({
      success: true,
      count: accounts.length,
      accounts,
    });
  } catch (error) {
    console.error("Fetch Gmail accounts error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch connected Gmail accounts",
    });
  }
};

// Disconnect a Gmail account
const disconnectGmail = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await GmailAccount.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Connected Gmail account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Gmail account disconnected successfully.",
    });

  } catch (error) {
    console.error("Disconnect Gmail error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to disconnect Gmail account.",
    });
  }
};

const sendEmail = async (req, res) => {
  try {
    const { accountId, to, subject, message } = req.body;

    // 1. Validate input
    if (!accountId || !to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (!validator.isEmail(to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient email address.",
      });
    }

    // 2. Prevent email header injection
    if (/[\r\n]/.test(to) || /[\r\n]/.test(subject)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email headers.",
      });
    }

    // 3. Find Gmail account belonging to logged-in user
    const account = await GmailAccount.findOne({
      _id: accountId,
      userId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Connected Gmail account not found.",
      });
    }

    // 4. Send email using reusable service
    const result = await sendGmailMessage({
      account,
      to,
      subject,
      message,
      filePath: req.file?.path,
      fileName: req.file?.originalname,
    });

    // 5. Save email history
    try {
      await EmailHistory.create({
        userId: req.user._id,
        gmailAccountId: account._id,
        from: account.email,
        to,
        subject,
        message,
        status: "sent",
        messageId: result.id,
        attachment: {
          filename: req.file?.originalname || null,
          size: req.file?.size || 0,
        },
        sentAt: new Date(),
      });
    } catch (historyError) {
      console.error("Email history save failed:", historyError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Email sent successfully!",
      messageId: result.id,
    });

  } catch (error) {
    console.error("Send email error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send email.",
    });

  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch((error) => {
        console.error("Temporary file cleanup failed:", error.message);
      });
    }
  }
};



// Send the same email separately to multiple recipients
const sendBulkEmail = async (req, res) => {
  try {
    const { accountId, recipients, subject, message } = req.body;

    // 1. Validate required fields
    if (!accountId || !recipients || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (/[\r\n]/.test(subject)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email subject.",
      });
    }

    // 2. Parse recipients
    let emailList;

    try {
      emailList =
        typeof recipients === "string"
          ? JSON.parse(recipients)
          : recipients;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid recipients format.",
      });
    }

    if (!Array.isArray(emailList) || emailList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide recipient email addresses.",
      });
    }

    // 3. Normalize recipients
    const normalizedRecipients = emailList.map((item) => {
      if (typeof item === "string") {
        return {
          email: item.trim().toLowerCase(),
          name: "",
        };
      }

      if (item && typeof item === "object") {
        return {
          email:
            typeof item.email === "string"
              ? item.email.trim().toLowerCase()
              : "",
          name:
            typeof item.name === "string" ? item.name.trim() : "",
        };
      }

      return { email: "", name: "" };
    });

    // 4. Remove duplicate recipients
    const uniqueRecipients = [];
    const seenEmails = new Set();

    normalizedRecipients.forEach((recipient) => {
      if (!seenEmails.has(recipient.email)) {
        seenEmails.add(recipient.email);
        uniqueRecipients.push(recipient);
      }
    });

    if (uniqueRecipients.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 recipients allowed per batch.",
      });
    }

    // 5. Validate emails
    const invalidEmails = uniqueRecipients
      .filter((recipient) => !validator.isEmail(recipient.email))
      .map((recipient) => recipient.email);

    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some recipient email addresses are invalid.",
        invalidEmails,
      });
    }

    // 4. Find Gmail account belonging to logged-in user
    const account = await GmailAccount.findOne({
      _id: accountId,
      userId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Connected Gmail account not found.",
      });
    }

    // 5. Send emails one by one
    const results = [];

    for (let i = 0; i < uniqueRecipients.length; i++) {
      const recipient = uniqueRecipients[i];
      const to = recipient.email;

      // Replace {{name}} with the recipient's actual name
      const personalizedMessage = message.replace(
        /{{name}}/gi,
        recipient.name || "there"
      );

      try {
        const result = await sendGmailMessage({
          account,
          to,
          subject,
          message: personalizedMessage,
          filePath: req.file?.path,
          fileName: req.file?.originalname,
        });

        await EmailHistory.create({
          userId: req.user._id,
          gmailAccountId: account._id,
          from: account.email,
          to,
          subject,
          message: personalizedMessage,
          status: "sent",
          messageId: result.id,
          attachment: {
            filename: req.file?.originalname || null,
            size: req.file?.size || 0,
          },
          sentAt: new Date(),
        });

        results.push({
          email: to,
          status: "sent",
          messageId: result.id,
        });
      } catch (error) {
        console.error(`Email failed for ${to}:`, error.message);

        results.push({
          email: to,
          status: "failed",
          error: error.message,
        });

        // Save failed attempt in history
        try {
          await EmailHistory.create({
            userId: req.user._id,
            gmailAccountId: account._id,
            from: account.email,
            to,
            subject,
            message: personalizedMessage,
            status: "failed",
            error: error.message,
            attachment: {
              filename: req.file?.originalname || null,
              size: req.file?.size || 0,
            },
            sentAt: new Date(),
          });
        } catch (historyError) {
          console.error("Failed history save:", historyError.message);
        }
      }

      // Small pause between recipients
      if (i < uniqueRecipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // 6. Return batch results
    const sentCount = results.filter(
      (item) => item.status === "sent"
    ).length;

    const failedCount = results.filter(
      (item) => item.status === "failed"
    ).length;

    return res.status(200).json({
      success: true,
      message: "Bulk email processing completed.",
      total: uniqueRecipients.length,
      sent: sentCount,
      failed: failedCount,
      results,
    });

  } catch (error) {
    console.error("Bulk email error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process bulk emails.",
    });

  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch((error) => {
        console.error("Temporary file cleanup failed:", error.message);
      });
    }
  }
};



// Get logged-in user's email history
const getEmailHistory = async (req, res) => {
  try {
    // Pagination values from URL query parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );

    const skip = (page - 1) * limit;

    const search = (req.query.search || "").trim();

    const filter = {
      userId: req.user._id,
    };

    if (search) {
      filter.$or = [
        { to: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch only the logged-in user's email history
    const [history, total, sentTotal] = await Promise.all([
      EmailHistory.find(filter)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit),

      EmailHistory.countDocuments(filter),

      EmailHistory.countDocuments({
        ...filter,
        status: "sent",
      }),
    ]);

    return res.status(200).json({
      success: true,
      history,
      sentTotal,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch email history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch email history.",
    });
  }
};


// Get details of a single email
const getEmailDetails = async (req, res) => {
  try {
    const email = await EmailHistory.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found.",
      });
    }

    return res.status(200).json({
      success: true,
      email,
    });
  } catch (error) {
    console.error("Fetch email details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch email details.",
    });
  }
};

module.exports = {
  connectGmail,
  handleGmailCallback,
  getConnectedGmail,
  sendEmail,
  sendBulkEmail,
  getEmailHistory,
  getEmailDetails,
  disconnectGmail,
};