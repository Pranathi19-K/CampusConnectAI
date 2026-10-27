const documentRoutes = require("./routes/documentRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const noticeRoutes = require("./routes/noticeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const faqRoutes = require("./routes/faqRoutes");
const chatRoutes = require("./routes/chatRoutes");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());
app.use("/api/notices", noticeRoutes);
const studentRoutes = require("./routes/studentRoutes");
app.use("/api/students", studentRoutes);
app.use(express.urlencoded({ extended: true }));
app.use("/api/admin", adminRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", documentRoutes);
// Test route
app.get("/", (req, res) => {
  res.json({
    message: "CampusConnect AI Backend is running!",
    status: "success",
  });
});

// Connect MongoDB and start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing in .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Atlas connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
}

startServer();
