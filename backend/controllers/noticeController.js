const Notice = require("../models/Notice");

exports.createNotice = async (req, res) => {
  try {
    const { title, content, category, publishedBy, expiresAt } = req.body;

    if (!title || !content || !publishedBy) {
      return res.status(400).json({
        message: "Title, content and publishedBy are required",
      });
    }

    const notice = await Notice.create({
      title,
      content,
      category,
      publishedBy,
      expiresAt: expiresAt || null,
    });

    return res.status(201).json({
      message: "Notice created successfully",
      notice,
    });
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
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    filter.$or = [
      ...(filter.$or || []),
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ];

    const notices = await Notice.find(filter).sort({ publishedAt: -1 });

    return res.status(200).json({
      count: notices.length,
      notices,
    });
  } catch (error) {
    console.error("Get notices error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch notices",
    });
  }
};

module.exports = { createNotice: exports.createNotice, getNotices: exports.getNotices };
