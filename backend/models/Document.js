const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: String,
      default: "admin",
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", documentSchema);
