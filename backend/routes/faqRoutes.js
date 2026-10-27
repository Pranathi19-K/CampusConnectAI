const express = require("express");
const router = express.Router({ mergeParams: true });

const { createFAQ, getFAQs } = require("../controllers/faqController");
const adminAuth = require("../middleware/adminAuth");

router.get("/", getFAQs);
router.post("/", adminAuth, createFAQ);

module.exports = router;
