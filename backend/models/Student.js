const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    rollNumber: { type: String, required: true, unique: true, trim: true },
    department: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1, max: 6 },
    password: { type: String, required: true, minlength: 8, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
