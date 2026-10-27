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

    const adminEmail = process.env.ADMIN_EMAIL;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !passwordHash || !jwtSecret) {
      return res.status(500).json({
        message: "Admin credentials or JWT_SECRET are not configured",
      });
    }

    const emailMatches =
      email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

    const passwordMatches = await bcrypt.compare(password, passwordHash);
    console.log("Admin email matches:", emailMatches);
console.log("Admin password matches:", passwordMatches);

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
  console.error("Admin login error:", error);

  return res.status(500).json({
    message: "Unable to log in as admin",
  });
}
};
