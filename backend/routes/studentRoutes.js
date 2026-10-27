const express = require("express");
const router = express.Router({ mergeParams: true });
const studentController = require("../controllers/studentController");

router.post("/register", studentController.registerStudent);
router.post("/login", studentController.loginStudent);

module.exports = router;
