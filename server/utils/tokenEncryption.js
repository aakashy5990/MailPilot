
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

// Get encryption key from environment
const ENCRYPTION_KEY = Buffer.from(
  process.env.TOKEN_ENCRYPTION_KEY,
  "base64"
);

// Validate key length (32 bytes = 256 bits)
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
}

// Encrypt token
const encryptToken = (token) => {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    iv
  );

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex")
  };
};

// Decrypt token
const decryptToken = (encryptedObject) => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(encryptedObject.iv, "hex")
  );

  decipher.setAuthTag(
    Buffer.from(encryptedObject.authTag, "hex")
  );

  let decrypted = decipher.update(
    encryptedObject.encryptedData,
    "hex",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  return decrypted;
};

module.exports = {
  encryptToken,
  decryptToken
};
