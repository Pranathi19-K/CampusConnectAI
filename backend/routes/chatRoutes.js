const express = require("express");
const router = express.Router({ mergeParams: true });

const { askQuestion } = require("../controllers/chatController");

router.post("/ask", askQuestion);

module.exports = router;
