const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const isProduction = process.env.NODE_ENV === "production";
    const adminEmail = process.env.ADMIN_EMAIL || (!isProduction ? "admin@campusconnect.edu" : null);
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET || (!isProduction ? "campusconnect-jwt-secret-key-2026" : null);

    // In production, require strict environment variable configuration
    if (isProduction && (!adminEmail || !passwordHash || !jwtSecret)) {
      console.error("[Security] Admin login attempted but ADMIN_EMAIL, ADMIN_PASSWORD_HASH, or JWT_SECRET is not configured in production.");
      return res.status(500).json({
        message: "Server admin credentials or JWT_SECRET are not configured for production",
      });
    }

    if (!adminEmail || !jwtSecret) {
      return res.status(500).json({
        message: "Admin authentication configuration missing",
      });
    }

    const emailMatches =
      email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

    let passwordMatches = false;
    if (passwordHash) {
      try {
        passwordMatches = await bcrypt.compare(password, passwordHash);
      } catch (err) {
        console.error("Bcrypt comparison error in admin login");
      }
    }

    // In non-production only, allow dev fallback if hash not configured or matches dev password
    if (!isProduction && !passwordMatches && (password === "adminPassword123" || !passwordHash)) {
      passwordMatches = true;
    }

    if (!emailMatches || !passwordMatches) {
      return res.status(401).json({
        message: "Invalid admin email or password",
      });
    }

    const token = jwt.sign(
      { role: "admin", email: adminEmail },
      jwtSecret,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Admin login successful",
      token,
      admin: { email: adminEmail, role: "admin" },
    });
  } catch (error) {
    console.error("Admin login error occurred");

    return res.status(500).json({
      message: "Unable to log in as admin",
    });
  }
};
