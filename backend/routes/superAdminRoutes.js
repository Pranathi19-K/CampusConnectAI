const express = require("express");
const router = express.Router();
const superAdminAuth = require("../middleware/adminAuth");
const {
  getAllColleges,
  updateCollegeStatus,
  createCollegeAdmin,
  getPlatformStats,
} = require("../controllers/superAdminController");

router.use(superAdminAuth);

router.get("/colleges", getAllColleges);
router.patch("/colleges/:id/status", updateCollegeStatus);
router.post("/colleges/:id/admin", createCollegeAdmin);
router.get("/stats", getPlatformStats);

module.exports = router;
