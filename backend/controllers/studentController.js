const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerStudent = async (req, res) => {
  try {
    const { name, email, rollNumber, department, year } = req.body;

    if (!name || !email || !rollNumber || !department || year == null) {
      return res.status(400).json({
        message: "Please provide all required student details",
      });
    }

    const existingStudent = await Student.findOne({
      $or: [
        { email: email.toLowerCase() },
        { rollNumber: rollNumber },
      ],
    });

    if (existingStudent) {
      return res.status(409).json({
        message: "Email or roll number already registered",
      });
    }

    const student = await Student.create({
      name,
      email,
      rollNumber,
      department,
      year,
    });

    return res.status(201).json({
      message: "Student registered successfully",
      student,
    });
  } catch (error) {
    console.error("Student registration error:", error.message);

    return res.status(500).json({
      message: "Unable to register student",
    });
  }
};


exports.registerStudent = async (req, res) => {
  try {
    const { name, email, rollNumber, department, year, password } = req.body;

    if (
      !name || !email || !rollNumber ||
      !department || year == null || !password
    ) {
      return res.status(400).json({
        message: "Please provide all required details, including password",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRollNumber = rollNumber.trim();

    const existingStudent = await Student.findOne({
      $or: [
        { email: normalizedEmail },
        { rollNumber: normalizedRollNumber },
      ],
    });

    if (existingStudent) {
      return res.status(409).json({
        message: "Email or roll number already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const student = await Student.create({
      name,
      email: normalizedEmail,
      rollNumber: normalizedRollNumber,
      department,
      year,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Student registered successfully",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
      },
    });
  } catch (error) {
    console.error("Student registration error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email or roll number already registered",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid student details",
      });
    }

    return res.status(500).json({
      message: "Unable to register student",
    });
  }
};


exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!process.env.JWT_SECRET ||
        process.env.JWT_SECRET === "19f0ee86adc20318707f76d6c05fb15af92b2d4a5f8587514e75f26ca13da555347430e00a1a1901faf9237d4abccb88") {
      return res.status(500).json({
        message: "Please configure a strong JWT_SECRET in .env",
      });
    }

    const Student = require("../models/Student");
    const bcrypt = require("bcryptjs");
    const jwt = require("jsonwebtoken");

    const student = await Student.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!student) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      student.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { studentId: student._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
      },
    });
  } catch (error) {
    console.error("Student login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in",
    });
  }
};
