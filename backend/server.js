const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const collegeRoutes = require("./routes/collegeRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const collegeAdminRoutes = require("./routes/collegeAdminRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const faqRoutes = require("./routes/faqRoutes");
const chatRoutes = require("./routes/chatRoutes");
const studentRoutes = require("./routes/studentRoutes");
const documentRoutes = require("./routes/documentRoutes");
const { seedAndMigrateColleges } = require("./utils/seedColleges");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core Multi-College platform routes
app.use("/api/colleges", collegeRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/college-admin", collegeAdminRoutes);

// College-scoped nested endpoints
app.use("/api/colleges/:collegeId/notices", noticeRoutes);
app.use("/api/colleges/:collegeId/faqs", faqRoutes);
app.use("/api/colleges/:collegeId/chat", chatRoutes);
app.use("/api/colleges/:collegeId/students", studentRoutes);

// Backwards-compatible legacy routes
app.use("/api/notices", noticeRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", documentRoutes);

// Health check endpoint clearly distinguishing MongoDB from in-memory demo
app.get("/api/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: "ok",
    app: "CampusConnectAI",
    platform: "multi-college",
    persistence: isDbConnected ? "mongodb" : "in-memory-demo",
    isDemoMode: !isDbConnected,
    notice: isDbConnected
      ? "Data is persisted to MongoDB database."
      : "Running in non-persistent in-memory demo mode. Any added notices, FAQs, documents or registrations are volatile.",
  });
});

// Database error handling middleware
app.use((err, req, res, next) => {
  if (
    err.name === "MongooseError" ||
    err.name === "MongoNetworkError" ||
    (err.message && err.message.includes("buffering timed out"))
  ) {
    console.warn("[Database Offline] Falling back gracefully to safe response");
    if (req.method === "GET") {
      return res.json(req.path.endsWith("s") || req.path.endsWith("s/") ? [] : {});
    }
    return res.status(503).json({ error: "Service temporarily unavailable (database offline)" });
  }
  next(err);
});

const PORT = parseInt(process.env.PORT, 10) || 3000;

async function startServer() {
  if (process.env.MONGODB_URI) {
    try {
      mongoose.set("bufferCommands", false);
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB Atlas connected successfully!");
      await seedAndMigrateColleges();
    } catch (error) {
      console.warn("Database connection failed, running with in-memory store:", error.message);
    }
  } else {
    console.log("MONGODB_URI not provided — running with in-memory store fallback.");
  }

  if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

module.exports = app;
