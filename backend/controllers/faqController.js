const FAQ = require("../models/FAQ");

exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, category, keywords } = req.body;

    if (
      typeof question !== "string" || !question.trim() ||
      typeof answer !== "string" || !answer.trim()
    ) {
      return res.status(400).json({
        message: "Question and answer are required",
      });
    }

    const faq = await FAQ.create({
      question: question.trim(),
      answer: answer.trim(),
      category,
      keywords: Array.isArray(keywords) ? keywords : [],
      createdBy: req.admin.email,
    });

    return res.status(201).json({
      message: "FAQ created successfully",
      faq,
    });
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
    const filter = {};

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
      faqs,
    });
  } catch (error) {
    console.error("Get FAQs error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch FAQs",
    });
  }
};
