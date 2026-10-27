const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const mongoose = require("mongoose");
const Document = require("../models/Document");
const { memoryStore } = require("../models/mockData");

const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure file storage with safe sanitized names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-150);

    cb(null, `${Date.now()}-${safeName}`);
  },
});

// Allow only PDF and DOCX files (maximum 10 MB)
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [".pdf", ".docx"];

    if (!allowedExtensions.includes(extension)) {
      return cb(new Error("Only PDF and DOCX files are allowed."));
    }

    cb(null, true);
  },
}).single("document");

// Handle upload errors
function uploadMiddleware(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Document upload failed.",
      });
    }

    next();
  });
}

// Extract text from PDF or DOCX
async function extractDocumentText(filePath, extension) {
  if (extension === ".pdf") {
    const buffer = fs.readFileSync(filePath);

    const parser = new pdfParse.PDFParse({
      data: buffer,
    });

    try {
      const result = await parser.getText();
      return result.text || "";
    } finally {
      await parser.destroy();
    }
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({
      path: filePath,
    });

    return result.value || "";
  }

  throw new Error("Unsupported document format.");
}

// Upload document, extract text, and save to MongoDB (or demo memory if offline)
async function uploadDocument(req, res) {
  let uploadedPath;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a PDF or DOCX document.",
      });
    }

    uploadedPath = req.file.path;

    const extension = path.extname(req.file.originalname).toLowerCase();

    const text = await extractDocumentText(
      uploadedPath,
      extension
    );

    if (!text.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "No readable text found. Scanned PDFs need OCR support.",
      });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let savedDocument;

    if (isDbConnected) {
      savedDocument = await Document.create({
        originalName: req.file.originalname,
        filename: req.file.filename,
        category: req.body.category || "General",
        extractedText: text,
        uploadedBy: req.admin?.email || "admin",
      });
    } else {
      savedDocument = {
        _id: "doc_" + Date.now(),
        originalName: req.file.originalname,
        filename: req.file.filename,
        category: req.body.category || "General",
        extractedText: text,
        uploadedBy: req.admin?.email || "admin",
        createdAt: new Date(),
      };
      memoryStore.documents.unshift(savedDocument);
    }

    // Clean up temporary disk file after text is extracted and stored
    if (uploadedPath && fs.existsSync(uploadedPath)) {
      try {
        fs.unlinkSync(uploadedPath);
      } catch (e) {}
    }

    return res.status(201).json({
      success: true,
      message: isDbConnected
        ? "Document uploaded and saved to MongoDB successfully."
        : "Document processed (demo mode: stored in volatile memory, not persisted to database).",
      isDemoMode: !isDbConnected,
      document: {
        _id: savedDocument._id,
        originalName: savedDocument.originalName,
        filename: savedDocument.filename,
        category: savedDocument.category,
        textLength: text.length,
        uploadedAt: savedDocument.createdAt,
      },
    });
  } catch (error) {
    // Remove the uploaded file if processing or saving fails
    if (uploadedPath && fs.existsSync(uploadedPath)) {
      try {
        fs.unlinkSync(uploadedPath);
      } catch (e) {}
    }

    console.error("Document processing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process this document.",
    });
  }
}

module.exports = {
  uploadMiddleware,
  uploadDocument,
};
