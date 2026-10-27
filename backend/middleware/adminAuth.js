const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Admin authentication token required",
      });
    }

    const token = authHeader.split(" ")[1];
    const isProduction = process.env.NODE_ENV === "production";
    const secret = process.env.JWT_SECRET || (!isProduction ? "campusconnect-jwt-secret-key-2026" : null);

    if (!secret) {
      console.error("[Security] JWT_SECRET is not configured for production verification.");
      return res.status(500).json({
        message: "Server authentication configuration missing",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin access only",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
