const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    rollNumber: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1, max: 6 },
    password: { type: String, required: true, minlength: 8, select: false },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index: email and rollNumber unique per college
studentSchema.index({ collegeId: 1, email: 1 });
studentSchema.index({ collegeId: 1, rollNumber: 1 });

module.exports = mongoose.model("Student", studentSchema);
