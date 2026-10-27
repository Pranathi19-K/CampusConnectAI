const College = require("../models/College");
const CollegeAdmin = require("../models/CollegeAdmin");
const Student = require("../models/Student");
const Notice = require("../models/Notice");
const FAQ = require("../models/FAQ");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { memoryStore } = require("../models/mockData");

// View all colleges in platform (including pending reviews)
exports.getAllColleges = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const colleges = await College.find().sort({ createdAt: -1 });
      return res.status(200).json({ count: colleges.length, colleges });
    } else {
      return res.status(200).json({
        count: memoryStore.colleges.length,
        colleges: memoryStore.colleges,
      });
    }
  } catch (error) {
    console.error("Super Admin get all colleges error:", error.message);
    return res.status(500).json({ message: "Unable to retrieve colleges" });
  }
};

// Approve, activate, or suspend a college
exports.updateCollegeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isApproved } = req.body;

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const updateData = {};
      if (status) updateData.status = status;
      if (typeof isApproved === "boolean") updateData.isApproved = isApproved;

      const college = await College.findByIdAndUpdate(id, updateData, { new: true });

      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }

      return res.status(200).json({
        message: "College status updated successfully",
        college,
      });
    } else {
      const college = memoryStore.colleges.find((c) => c._id === id || c.slug === id);

      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }

      if (status) college.status = status;
      if (typeof isApproved === "boolean") college.isApproved = isApproved;

      return res.status(200).json({
        message: "College status updated (demo mode)",
        college,
      });
    }
  } catch (error) {
    console.error("Super Admin update college status error:", error.message);
    return res.status(500).json({ message: "Unable to update college status" });
  }
};

// Provision a dedicated College Admin account
exports.createCollegeAdmin = async (req, res) => {
  try {
    const { id } = req.params; // college ID
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Admin name, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    const normalizedEmail = email.trim().toLowerCase();

    if (isDbConnected) {
      const college = await College.findById(id);
      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }

      const existing = await CollegeAdmin.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ message: "Admin with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await CollegeAdmin.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        collegeId: college._id,
        role: "college_admin",
      });

      return res.status(201).json({
        message: `College admin created successfully for ${college.name}`,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          collegeId: admin.collegeId,
          role: admin.role,
        },
      });
    } else {
      const college = memoryStore.colleges.find((c) => c._id === id || c.slug === id);
      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }

      const existing = memoryStore.collegeAdmins.find((a) => a.email === normalizedEmail);
      if (existing) {
        return res.status(409).json({ message: "Admin with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = {
        _id: "admin_" + Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        collegeId: college._id,
        role: "college_admin",
        isActive: true,
      };

      memoryStore.collegeAdmins.push(admin);

      return res.status(201).json({
        message: `College admin created (demo mode) for ${college.name}`,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          collegeId: admin.collegeId,
          role: admin.role,
        },
      });
    }
  } catch (error) {
    console.error("Super Admin create college admin error:", error.message);
    return res.status(500).json({ message: "Unable to create college admin" });
  }
};

// Platform-level counts and statistics
exports.getPlatformStats = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const [collegesCount, studentsCount, noticesCount, faqsCount] = await Promise.all([
        College.countDocuments(),
        Student.countDocuments(),
        Notice.countDocuments(),
        FAQ.countDocuments(),
      ]);

      return res.status(200).json({
        colleges: collegesCount,
        students: studentsCount,
        notices: noticesCount,
        faqs: faqsCount,
        database: "mongodb",
      });
    } else {
      return res.status(200).json({
        colleges: memoryStore.colleges.length,
        students: memoryStore.students.length,
        notices: memoryStore.notices.length,
        faqs: memoryStore.faqs.length,
        database: "in-memory-demo",
      });
    }
  } catch (error) {
    console.error("Super Admin get stats error:", error.message);
    return res.status(500).json({ message: "Unable to retrieve platform statistics" });
  }
};
