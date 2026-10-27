const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Academics",
        "Examinations",
        "Placements",
        "Admissions",
        "Campus Services",
        "General",
      ],
      default: "General",
    },
    keywords: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FAQ", faqSchema);
