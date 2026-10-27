require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const collegeRoutes = require("./backend/routes/collegeRoutes");
const superAdminRoutes = require("./backend/routes/superAdminRoutes");
const collegeAdminRoutes = require("./backend/routes/collegeAdminRoutes");
const noticeRoutes = require("./backend/routes/noticeRoutes");
const adminRoutes = require("./backend/routes/adminRoutes");
const faqRoutes = require("./backend/routes/faqRoutes");
const chatRoutes = require("./backend/routes/chatRoutes");
const documentRoutes = require("./backend/routes/documentRoutes");
const studentRoutes = require("./backend/routes/studentRoutes");
const { seedAndMigrateColleges } = require("./backend/utils/seedColleges");

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

// Database error handler middleware for graceful fallback
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
      // Automatically check and run non-destructive college seeder/migration
      await seedAndMigrateColleges();
    } catch (err) {
      console.warn("MongoDB connection failed — falling back to in-memory demo store:", err.message);
    }
  } else {
    console.log("MONGODB_URI not provided — running in volatile demo mode.");
  }

  // Frontend integration: Vite dev middleware in dev, static dist in production
  const isProduction = process.env.NODE_ENV === "production";
  const distPath = path.join(__dirname, "frontend", "dist");

  if (isProduction && fs.existsSync(distPath)) {
    console.log("Serving frontend from production build:", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("Mounting Vite dev middleware for frontend...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      root: path.join(__dirname, "frontend"),
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CampusConnectAI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
