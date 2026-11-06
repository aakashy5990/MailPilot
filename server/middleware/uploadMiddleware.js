const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

// Temporary upload folder
const uploadDirectory = path.join(__dirname, "../uploads");

// Create folder if it doesn't exist
fs.mkdirSync(uploadDirectory, { recursive: true });

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName = crypto.randomUUID() + ".pdf";
    cb(null, uniqueName);
  }
});

// Basic PDF file checks
const fileFilter = (req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" &&
    path.extname(file.originalname).toLowerCase() === ".pdf";

  if (!isPdf) {
    return cb(new Error("Only PDF files are allowed."));
  }

  cb(null, true);
};

// Configure Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});

// Verify actual PDF signature
const validatePdf = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const buffer = Buffer.alloc(5);

  try {
    const fd = fs.openSync(req.file.path, "r");

    try {
      const bytesRead = fs.readSync(fd, buffer, 0, 5, 0);

      const signature = buffer.toString("ascii", 0, bytesRead);

      if (signature !== "%PDF-") {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          success: false,
          message: "Invalid PDF file."
        });
      }
    } finally {
      fs.closeSync(fd);
    }

    next();

  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(400).json({
      success: false,
      message: "Unable to validate uploaded PDF."
    });
  }
};

module.exports = {
  upload,
  validatePdf
};