
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Document = require("../models/Document");

const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure file storage
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

    if ([".pdf", ".docx"].includes(extension)) {
      return cb(null, true);
    }

    cb(new Error("Only PDF and DOCX files are allowed."));
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

// Upload document and save it to MongoDB
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

    // Save document details and extracted text to MongoDB
    const savedDocument = await Document.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      category: req.body.category || "General",
      extractedText: text,
      uploadedBy: "admin",
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded and saved successfully.",
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
      fs.unlinkSync(uploadedPath);
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
