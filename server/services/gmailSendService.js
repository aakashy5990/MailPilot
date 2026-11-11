
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { google } = require("googleapis");

const { createOAuthClient } = require("../config/google");
const { decryptToken } = require("../utils/tokenEncryption");

const sendGmailMessage = async ({
  account,
  to,
  subject,
  message,
  attachments = [],
}) => {
  // 1. Decrypt Gmail refresh token
  const refreshToken = decryptToken({
    encryptedData: account.encryptedRefreshToken,
    iv: account.iv,
    authTag: account.authTag,
  });

  // 2. Create OAuth client
  const oauth2Client = createOAuthClient();

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // 3. Gmail API client
  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  // 4. MIME boundary
  const boundary = `mailpilot_${crypto.randomUUID()}`;

  // 5. Email headers
  const emailParts = [
    `From: ${account.email}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(message, "utf8").toString("base64"),
  ];

  // 6. Add attachments
  for (const attachment of attachments) {
    const fileData = await fs.readFile(attachment.path);

    // Original filename
    const originalFilename =
      attachment.filename || attachment.originalname || "attachment";

    const safeFilename = path
      .basename(originalFilename.replace(/\\/g, "/"))
      .replace(/[\r\n"]/g, "_");

    // MIME type
    const mimeType =
      attachment.contentType ||
      attachment.mimetype ||
      "application/octet-stream";

    // Base64 encoding
    const attachmentBase64 = fileData
      .toString("base64")
      .match(/.{1,76}/g)
      .join("\r\n");

    emailParts.push(
      `--${boundary}`,
      `Content-Type: ${mimeType}; name="${safeFilename}"`,
      `Content-Disposition: attachment; filename="${safeFilename}"`,
      "Content-Transfer-Encoding: base64",
      "",
      attachmentBase64
    );
  }

  // 7. Close MIME message
  emailParts.push(`--${boundary}--`);

  // 8. Gmail API format
  const emailContent = emailParts.join("\r\n");

  const rawMessage = Buffer.from(emailContent).toString("base64url");

  // 9. Send email
  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: rawMessage,
    },
  });

  return result.data;
};

module.exports = sendGmailMessage;
