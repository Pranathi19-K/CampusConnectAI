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
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      index: true,
    },
  },
  { timestamps: true }
);

faqSchema.index({ collegeId: 1, category: 1 });

module.exports = mongoose.model("FAQ", faqSchema);
