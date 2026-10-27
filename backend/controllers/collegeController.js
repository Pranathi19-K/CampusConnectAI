const College = require("../models/College");
const mongoose = require("mongoose");
const { memoryStore } = require("../models/mockData");

// Get public directory of active and approved colleges
exports.getColleges = async (req, res) => {
  try {
    const { search } = req.query;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const filter = { status: "active", isApproved: true };

      if (search && search.trim()) {
        const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [
          { name: { $regex: term, $options: "i" } },
          { code: { $regex: term, $options: "i" } },
          { "location.city": { $regex: term, $options: "i" } },
          { "location.state": { $regex: term, $options: "i" } },
        ];
      }

      const colleges = await College.find(filter).sort({ name: 1 });

      return res.status(200).json({
        count: colleges.length,
        isDemoMode: false,
        colleges,
      });
    } else {
      let filtered = memoryStore.colleges.filter(
        (c) => c.status === "active" && c.isApproved === true
      );

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        filtered = filtered.filter(
          (c) =>
            (c.name && c.name.toLowerCase().includes(term)) ||
            (c.code && c.code.toLowerCase().includes(term)) ||
            (c.location?.city && c.location.city.toLowerCase().includes(term)) ||
            (c.location?.state && c.location.state.toLowerCase().includes(term))
        );
      }

      return res.status(200).json({
        count: filtered.length,
        isDemoMode: true,
        colleges: filtered,
      });
    }
  } catch (error) {
    console.error("Get colleges error:", error.message);
    return res.status(500).json({ message: "Unable to retrieve colleges directory" });
  }
};

// Get single college profile by slug (e.g., 'apex-tech')
exports.getCollegeBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const college = await College.findOne({ slug: slug.toLowerCase() });

      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }

      return res.status(200).json({
        isDemoMode: false,
        college,
      });
    } else {
      const college = memoryStore.colleges.find(
        (c) => c.slug === slug.toLowerCase() || c._id === slug
      );

      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }

      return res.status(200).json({
        isDemoMode: true,
        college,
      });
    }
  } catch (error) {
    console.error("Get college by slug error:", error.message);
    return res.status(500).json({ message: "Unable to retrieve college profile" });
  }
};

// Public college registration request
exports.registerCollege = async (req, res) => {
  try {
    const { name, code, city, state, description, contactEmail, contactPhone, website } = req.body;

    if (!name || !code || !contactEmail) {
      return res.status(400).json({
        message: "College name, unique code, and official contact email are required",
      });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const existing = await College.findOne({
        $or: [{ code: code.toUpperCase() }, { slug }],
      });

      if (existing) {
        return res.status(409).json({
          message: "A college with this name or code is already registered",
        });
      }

      const college = await College.create({
        name: name.trim(),
        slug,
        code: code.trim().toUpperCase(),
        location: { city: city || "", state: state || "", country: "India" },
        description: description || `Welcome to ${name.trim()}`,
        contact: {
          email: contactEmail.trim().toLowerCase(),
          phone: contactPhone || "",
          website: website || "",
        },
        status: "pending",
        isApproved: false,
      });

      return res.status(201).json({
        message: "College registration submitted successfully. It will be activated after Super Admin review.",
        isDemoMode: false,
        college,
      });
    } else {
      const existing = memoryStore.colleges.find(
        (c) => c.code === code.toUpperCase() || c.slug === slug
      );

      if (existing) {
        return res.status(409).json({
          message: "A college with this name or code is already registered",
        });
      }

      const college = {
        _id: "college_" + Date.now(),
        name: name.trim(),
        slug,
        code: code.trim().toUpperCase(),
        location: { city: city || "", state: state || "", country: "India" },
        description: description || `Welcome to ${name.trim()}`,
        contact: {
          email: contactEmail.trim().toLowerCase(),
          phone: contactPhone || "",
          website: website || "",
        },
        branding: {
          primaryColor: "#05192e",
          secondaryColor: "#d4af37",
          accentColor: "#2563eb",
          campusImage: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=90",
        },
        status: "pending",
        isApproved: false,
        createdAt: new Date().toISOString(),
      };

      memoryStore.colleges.push(college);

      return res.status(201).json({
        message: "College registration submitted (demo mode). Awaiting Super Admin review.",
        isDemoMode: true,
        college,
      });
    }
  } catch (error) {
    console.error("Register college error:", error.message);
    return res.status(500).json({ message: "Unable to submit college registration" });
  }
};
