const express = require("express");
const router = express.Router();
const {
  getColleges,
  getCollegeBySlug,
  registerCollege,
} = require("../controllers/collegeController");

router.get("/", getColleges);
router.get("/:slug", getCollegeBySlug);
router.post("/register", registerCollege);

module.exports = router;
