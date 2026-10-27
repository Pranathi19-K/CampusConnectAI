const express = require("express");
const router = express.Router();
const collegeAdminAuth = require("../middleware/collegeAdminAuth");
const { uploadMiddleware } = require("../controllers/documentController");
const {
  collegeAdminLogin,
  createNotice,
  createFAQ,
  uploadDocument,
  updateBranding,
} = require("../controllers/collegeAdminController");

// Public college admin login
router.post("/login", collegeAdminLogin);

// Protected routes (college admin scoped)
router.post("/notices", collegeAdminAuth, createNotice);
router.post("/faqs", collegeAdminAuth, createFAQ);
router.post("/documents/upload", collegeAdminAuth, uploadMiddleware, uploadDocument);
router.patch("/branding", collegeAdminAuth, updateBranding);

module.exports = router;
