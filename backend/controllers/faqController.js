const FAQ = require("../models/FAQ");
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

exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, category, keywords } = req.body;
    const collegeId = await resolveCollegeId(req);

    if (
      typeof question !== "string" || !question.trim() ||
      typeof answer !== "string" || !answer.trim()
    ) {
      return res.status(400).json({
        message: "Question and answer are required",
      });
    }

    if (mongoose.connection.readyState === 1) {
      const faq = await FAQ.create({
        question: question.trim(),
        answer: answer.trim(),
        category,
        keywords: Array.isArray(keywords) ? keywords : [],
        createdBy: req.admin?.email || "Admin",
        collegeId: collegeId || null,
      });

      return res.status(201).json({
        message: "FAQ created successfully and saved to MongoDB",
        isDemoMode: false,
        faq,
      });
    } else {
      const faq = {
        _id: "faq_" + Date.now(),
        question: question.trim(),
        answer: answer.trim(),
        category: category || "General",
        keywords: Array.isArray(keywords) ? keywords : [],
        createdBy: req.admin?.email || "Admin",
        collegeId: collegeId || "college_apex",
        createdAt: new Date().toISOString(),
      };
      memoryStore.faqs.unshift(faq);

      return res.status(201).json({
        message: "FAQ created (demo mode: stored in volatile memory, not persisted to database)",
        isDemoMode: true,
        faq,
      });
    }
  } catch (error) {
    console.error("Create FAQ error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid FAQ details",
      });
    }

    return res.status(500).json({
      message: "Unable to create FAQ",
    });
  }
};

exports.getFAQs = async (req, res) => {
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

      if (search && search.trim()) {
        const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        filter.$or = [
          { question: { $regex: term, $options: "i" } },
          { answer: { $regex: term, $options: "i" } },
          { keywords: { $regex: term, $options: "i" } },
        ];
      }

      const faqs = await FAQ.find(filter).sort({ createdAt: -1 });

      return res.status(200).json({
        count: faqs.length,
        isDemoMode: false,
        dataSource: "mongodb",
        faqs,
      });
    } else {
      let filtered = [...memoryStore.faqs];

      if (resolvedCollegeId) {
        filtered = filtered.filter(
          (f) => String(f.collegeId) === String(resolvedCollegeId)
        );
      }

      if (category) {
        filtered = filtered.filter((f) => f.category === category);
      }

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        filtered = filtered.filter((f) =>
          (f.question && f.question.toLowerCase().includes(term)) ||
          (f.answer && f.answer.toLowerCase().includes(term)) ||
          (f.keywords && f.keywords.some((k) => k.toLowerCase().includes(term)))
        );
      }

      return res.status(200).json({
        count: filtered.length,
        isDemoMode: true,
        dataSource: "in-memory-demo",
        faqs: filtered,
      });
    }
  } catch (error) {
    console.error("Get FAQs error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch FAQs",
    });
  }
};
