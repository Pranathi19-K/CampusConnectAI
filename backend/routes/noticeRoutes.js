const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  createNotice,
  getNotices,
} = require("../controllers/noticeController");

const adminAuth = require("../middleware/adminAuth");

// Public: students can view notices
router.get("/", getNotices);

// Protected: only authenticated admin can create notices
router.post("/", adminAuth, createNotice);

module.exports = router;