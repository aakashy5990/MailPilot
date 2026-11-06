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
  filePath,
  fileName,
}) => {
  // 1. Decrypt Gmail refresh token
  const refreshToken = decryptToken({
    encryptedData: account.encryptedRefreshToken,
    iv: account.iv,
    authTag: account.authTag,
  });

  // 2. Create Google OAuth client
  const oauth2Client = createOAuthClient();

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // 3. Create Gmail API client
  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  // 4. Create unique MIME boundary
  const boundary = `mailpilot_${crypto.randomUUID()}`;

  // 5. Create email headers and message
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

  // 6. Add PDF attachment if available
  if (filePath) {
    const fileData = await fs.readFile(filePath);

    const safeFilename = path
      .basename(fileName || "attachment.pdf")
      .replace(/[\r\n"]/g, "_");

    const attachmentBase64 = fileData
      .toString("base64")
      .match(/.{1,76}/g)
      .join("\r\n");

    emailParts.push(
      `--${boundary}`,
      `Content-Type: application/pdf; name="${safeFilename}"`,
      `Content-Disposition: attachment; filename="${safeFilename}"`,
      "Content-Transfer-Encoding: base64",
      "",
      attachmentBase64
    );
  }

  // 7. Close MIME message
  emailParts.push(`--${boundary}--`);

  // 8. Convert to Gmail API format
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