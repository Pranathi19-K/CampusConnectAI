const Notice = require("../models/Notice");
const College = require("../models/College");
const mongoose = require("mongoose");
const { memoryStore } = require("../models/mockData");

// Helper to resolve college ID from params/query
async function resolveCollegeId(req) {
  const target = req.params?.collegeId || req.query?.collegeId;
  if (!target) return null;

  const isDbConnected = mongoose.connection.readyState === 1;
  if (isDbConnected) {
    const isObjectId = mongoose.Types.ObjectId.isValid(target);
    const college = await College.findOne({
      $or: [
        ...(isObjectId ? [{ _id: target }] : []),
        { slug: target.toLowerCase() },
        { code: target.toUpperCase() },
      ],
    });
    return college ? college._id : null;
  } else {
    const college = memoryStore.colleges.find(
      (c) => c._id === target || c.slug === target.toLowerCase() || c.code === target.toUpperCase()
    );
    return college ? college._id : target;
  }
}

exports.createNotice = async (req, res) => {
  try {
    const { title, content, category, publishedBy, expiresAt } = req.body;
    const collegeId = await resolveCollegeId(req);

    if (!title || !content || !publishedBy) {
      return res.status(400).json({
        message: "Title, content and publishedBy are required",
      });
    }

    if (mongoose.connection.readyState === 1) {
      const notice = await Notice.create({
        title: title.trim(),
        content: content.trim(),
        category,
        publishedBy: publishedBy.trim(),
        collegeId: collegeId || null,
        expiresAt: expiresAt || null,
      });

      return res.status(201).json({
        message: "Notice created successfully and saved to MongoDB",
        isDemoMode: false,
        notice,
      });
    } else {
      const notice = {
        _id: "notice_" + Date.now(),
        title: title.trim(),
        content: content.trim(),
        category: category || "General",
        publishedBy: publishedBy.trim(),
        collegeId: collegeId || "college_apex",
        publishedAt: new Date().toISOString(),
        expiresAt: expiresAt || null,
        createdAt: new Date().toISOString(),
      };
      memoryStore.notices.unshift(notice);

      return res.status(201).json({
        message: "Notice created (demo mode: stored in volatile memory, not persisted to database)",
        isDemoMode: true,
        notice,
      });
    }
  } catch (error) {
    console.error("Create notice error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid notice details",
      });
    }

    return res.status(500).json({
      message: "Unable to create notice",
    });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const { category, search } = req.query;
    const resolvedCollegeId = await resolveCollegeId(req);
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const filter = {};

      if (resolvedCollegeId) {
        filter.collegeId = resolvedCollegeId;
      }

      if (category) {
        filter.category = category;
      }

      const andClauses = [];
      if (search) {
        andClauses.push({
          $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
          ],
        });
      }

      andClauses.push({
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
      });

      filter.$and = andClauses;

      const notices = await Notice.find(filter).sort({ publishedAt: -1 });

      return res.status(200).json({
        count: notices.length,
        isDemoMode: false,
        dataSource: "mongodb",
        notices,
      });
    } else {
      let filtered = [...memoryStore.notices];

      if (resolvedCollegeId) {
        filtered = filtered.filter(
          (n) => String(n.collegeId) === String(resolvedCollegeId)
        );
      }

      if (category) {
        filtered = filtered.filter((n) => n.category === category);
      }

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        filtered = filtered.filter((n) =>
          (n.title && n.title.toLowerCase().includes(term)) ||
          (n.content && n.content.toLowerCase().includes(term))
        );
      }

      return res.status(200).json({
        count: filtered.length,
        isDemoMode: true,
        dataSource: "in-memory-demo",
        notices: filtered,
      });
    }
  } catch (error) {
    console.error("Get notices error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch notices",
    });
  }
};

module.exports = { createNotice: exports.createNotice, getNotices: exports.getNotices };
