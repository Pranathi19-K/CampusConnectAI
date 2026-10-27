const express = require("express");
const router = express.Router();

const {
  uploadMiddleware,
  uploadDocument,
} = require("../controllers/documentController");

const adminAuth = require("../middleware/adminAuth");

router.post(
  "/upload",
  adminAuth,
  uploadMiddleware,
  uploadDocument
);

module.exports = router;