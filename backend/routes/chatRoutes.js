
const express = require("express");
const router = express.Router();

const { askQuestion } = require("../controllers/chatController");

router.post("/ask", askQuestion);

module.exports = router;
