
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

// Temporary upload folder
const uploadDirectory = path.join(__dirname, "../uploads");

fs.mkdirSync(uploadDirectory, { recursive: true });

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = crypto.randomUUID() + extension;

    cb(null, uniqueName);
  },
});

// Allowed MIME types
const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

// Allowed extensions
const allowedExtensions = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".xls",
  ".xlsx",
  ".csv",
  ".ppt",
  ".pptx",
];

// File filter
const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const isAllowed =
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(extension);

  if (!isAllowed) {
    return cb(
      new Error("Unsupported file format.")
    );
  }

  cb(null, true);
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
});

// Validate uploaded attachments
const validateAttachments = (req, res, next) => {
  const files = req.files || [];

  const MAX_TOTAL_SIZE = 15 * 1024 * 1024;

  const totalSize = files.reduce(
    (total, file) => total + file.size,
    0
  );

  if (totalSize > MAX_TOTAL_SIZE) {
    files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    return res.status(400).json({
      success: false,
      message: "Total attachment size cannot exceed 15 MB.",
    });
  }

  try {
    for (const file of files) {
      const buffer = Buffer.alloc(12);

      const fd = fs.openSync(file.path, "r");

      let bytesRead;

      try {
        bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
      } finally {
        fs.closeSync(fd);
      }

      const extension = path.extname(file.originalname).toLowerCase();

      // PDF
      const isPdf =
        extension === ".pdf" &&
        buffer.subarray(0, 5).toString() === "%PDF-";

      // JPEG
      const isJpeg =
        [".jpg", ".jpeg"].includes(extension) &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff;

      // PNG
      const isPng =
        extension === ".png" &&
        buffer.subarray(0, 8).equals(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        );

      // GIF
      const isGif =
        extension === ".gif" &&
        ["GIF87a", "GIF89a"].includes(
          buffer.subarray(0, 6).toString()
        );

      // WEBP
      const isWebp =
        extension === ".webp" &&
        buffer.subarray(0, 4).toString() === "RIFF" &&
        buffer.subarray(8, 12).toString() === "WEBP";

      // Old Office formats
      const isOfficeFile =
        [".doc", ".xls", ".ppt"].includes(extension) &&
        buffer.subarray(0, 8).equals(
          Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
        );

      // Modern Office formats
      const isModernOfficeFile =
        [".docx", ".xlsx", ".pptx"].includes(extension) &&
        buffer.subarray(0, 4).equals(
          Buffer.from([0x50, 0x4b, 0x03, 0x04])
        );

      // TXT and CSV
      const isTextFile =
        [".txt", ".csv"].includes(extension) &&
        bytesRead > 0 &&
        !buffer.subarray(0, bytesRead).includes(0);

      const isValid =
        isPdf ||
        isJpeg ||
        isPng ||
        isGif ||
        isWebp ||
        isOfficeFile ||
        isModernOfficeFile ||
        isTextFile;

      if (!isValid) {
        throw new Error(`Invalid file: ${file.originalname}`);
      }
    }

    next();

  } catch (error) {
    files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    return res.status(400).json({
      success: false,
      message: "One or more files have invalid content or format.",
    });
  }
};

module.exports = {
  upload,
  validateAttachments,
};
