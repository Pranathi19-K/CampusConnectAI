const Student = require("../models/Student");
const College = require("../models/College");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { memoryStore } = require("../models/mockData");

function getJwtSecret() {
  const isProduction = process.env.NODE_ENV === "production";
  const secret = process.env.JWT_SECRET || (!isProduction ? "campusconnect-jwt-secret-key-2026" : null);
  if (!secret) {
    throw new Error("JWT_SECRET is not configured for production authentication");
  }
  return secret;
}

// Helper to resolve college ID (from params or body or default active college)
async function resolveCollegeId(req) {
  const targetId = req.params?.collegeId || req.body?.collegeId;
  const isDbConnected = mongoose.connection.readyState === 1;

  if (targetId) {
    if (isDbConnected) {
      // Check if targetId is an ObjectId or slug
      const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
      const college = await College.findOne({
        $or: [
          ...(isObjectId ? [{ _id: targetId }] : []),
          { slug: targetId.toLowerCase() },
          { code: targetId.toUpperCase() },
        ],
      });
      return college ? college._id.toString() : null;
    } else {
      const college = memoryStore.colleges.find(
        (c) => c._id === targetId || c.slug === targetId.toLowerCase() || c.code === targetId.toUpperCase()
      );
      return college ? college._id : null;
    }
  }

  // Fallback to primary college if no college specified (for backwards compatibility)
  if (isDbConnected) {
    const defaultCol = await College.findOne({ status: "active" }).sort({ createdAt: 1 });
    return defaultCol ? defaultCol._id.toString() : null;
  } else {
    const defaultCol = memoryStore.colleges.find((c) => c.status === "active");
    return defaultCol ? defaultCol._id : "college_apex";
  }
}

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

    const collegeId = await resolveCollegeId(req);

    if (!collegeId) {
      return res.status(400).json({
        message: "Invalid or inactive college specified for student registration",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRollNumber = rollNumber.trim();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const collegeObjectId = new mongoose.Types.ObjectId(collegeId);

      const existingStudent = await Student.findOne({
        collegeId: collegeObjectId,
        $or: [
          { email: normalizedEmail },
          { rollNumber: normalizedRollNumber },
        ],
      });

      if (existingStudent) {
        return res.status(409).json({
          message: "Email or roll number already registered at this college",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const student = await Student.create({
        name: name.trim(),
        email: normalizedEmail,
        rollNumber: normalizedRollNumber,
        department: department.trim(),
        year: Number(year),
        password: hashedPassword,
        collegeId: collegeObjectId,
      });

      return res.status(201).json({
        message: "Student registered successfully and saved to MongoDB",
        isDemoMode: false,
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          department: student.department,
          year: student.year,
          collegeId: student.collegeId,
        },
      });
    } else {
      const existing = memoryStore.students.find(
        (s) =>
          String(s.collegeId) === String(collegeId) &&
          (s.email === normalizedEmail || s.rollNumber === normalizedRollNumber)
      );

      if (existing) {
        return res.status(409).json({
          message: "Email or roll number already registered at this college",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const student = {
        _id: "student_" + Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        rollNumber: normalizedRollNumber,
        department: department.trim(),
        year: Number(year),
        password: hashedPassword,
        collegeId: collegeId,
      };

      memoryStore.students.push(student);

      return res.status(201).json({
        message: "Student registered (demo mode: stored in volatile memory)",
        isDemoMode: true,
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          department: student.department,
          year: student.year,
          collegeId: student.collegeId,
        },
      });
    }
  } catch (error) {
    console.error("Student registration error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email or roll number already registered at this college",
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

    const collegeId = await resolveCollegeId(req);
    const normalizedEmail = email.trim().toLowerCase();
    const jwtSecret = getJwtSecret();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const query = { email: normalizedEmail };
      if (collegeId) {
        query.collegeId = new mongoose.Types.ObjectId(collegeId);
      }

      const student = await Student.findOne(query).select("+password");

      if (!student) {
        return res.status(401).json({
          message: "Invalid email or password for this college",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, student.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid email or password for this college",
        });
      }

      const token = jwt.sign(
        {
          studentId: student._id.toString(),
          collegeId: student.collegeId ? student.collegeId.toString() : collegeId,
          role: "student",
          email: student.email,
        },
        jwtSecret,
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
          collegeId: student.collegeId,
        },
      });
    } else {
      const student = memoryStore.students.find(
        (s) =>
          s.email === normalizedEmail &&
          (!collegeId || String(s.collegeId) === String(collegeId))
      );

      if (!student) {
        return res.status(401).json({
          message: "Invalid email or password for this college",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, student.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid email or password for this college",
        });
      }

      const token = jwt.sign(
        {
          studentId: student._id,
          collegeId: student.collegeId || collegeId,
          role: "student",
          email: student.email,
        },
        jwtSecret,
        { expiresIn: "1d" }
      );

      return res.status(200).json({
        message: "Login successful (demo mode)",
        token,
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          department: student.department,
          year: student.year,
          collegeId: student.collegeId,
        },
      });
    }
  } catch (error) {
    console.error("Student login error:", error.message);

    return res.status(500).json({
      message: error.message && error.message.includes("JWT_SECRET")
        ? "Server authentication configuration missing"
        : "Unable to log in",
    });
  }
};
