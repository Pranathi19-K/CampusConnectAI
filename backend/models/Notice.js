const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Exam", "Placements", "Events", "General", "Academic"],
      default: "General",
    },
    publishedBy: {
      type: String,
      required: true,
      trim: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      index: true,
    },
  },
  { timestamps: true }
);

noticeSchema.index({ collegeId: 1, publishedAt: -1 });

module.exports = mongoose.model("Notice", noticeSchema);
