const { google } = require("googleapis");

// Create a fresh Google OAuth client whenever needed
const createOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// Permissions required by MailPilot
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "openid",
  "email",
];

module.exports = {
  createOAuthClient,
  SCOPES,
};