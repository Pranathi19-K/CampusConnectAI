const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    tagline: {
      type: String,
      default: "Excellence in Education, Research & Innovation",
    },
    location: {
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    description: {
      type: String,
      default: "",
    },
    branding: {
      primaryColor: { type: String, default: "#05192e" },
      secondaryColor: { type: String, default: "#d4af37" },
      accentColor: { type: String, default: "#2563eb" },
      campusImage: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=90",
      },
    },
    contact: {
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String, trim: true },
      website: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ["active", "pending", "inactive"],
      default: "active",
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("College", collegeSchema);
