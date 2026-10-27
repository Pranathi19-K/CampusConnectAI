const mongoose = require("mongoose");
const College = require("../models/College");
const Notice = require("../models/Notice");
const FAQ = require("../models/FAQ");
const Student = require("../models/Student");
const Document = require("../models/Document");
const { initialColleges, initialFaqs, initialNotices } = require("../models/mockData");

async function seedAndMigrateColleges() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    let mainCollege = await College.findOne({ slug: "apex-tech" });

    if (!mainCollege) {
      console.log("[Migration] Seeding initial colleges into MongoDB...");
      for (const col of initialColleges) {
        const { _id, ...colData } = col;
        const created = await College.create(colData);
        if (col.slug === "apex-tech") {
          mainCollege = created;
        }
      }
      console.log("[Migration] Colleges seeded successfully.");
    }

    if (mainCollege) {
      // Safely associate legacy records missing collegeId with main college
      const unassignedStudents = await Student.updateMany(
        { $or: [{ collegeId: null }, { collegeId: { $exists: false } }] },
        { $set: { collegeId: mainCollege._id } }
      );
      if (unassignedStudents.modifiedCount > 0) {
        console.log(`[Migration] Associated ${unassignedStudents.modifiedCount} legacy student(s) with ${mainCollege.name}`);
      }

      const unassignedNotices = await Notice.updateMany(
        { $or: [{ collegeId: null }, { collegeId: { $exists: false } }] },
        { $set: { collegeId: mainCollege._id } }
      );
      if (unassignedNotices.modifiedCount > 0) {
        console.log(`[Migration] Associated ${unassignedNotices.modifiedCount} legacy notice(s) with ${mainCollege.name}`);
      }

      const unassignedFaqs = await FAQ.updateMany(
        { $or: [{ collegeId: null }, { collegeId: { $exists: false } }] },
        { $set: { collegeId: mainCollege._id } }
      );
      if (unassignedFaqs.modifiedCount > 0) {
        console.log(`[Migration] Associated ${unassignedFaqs.modifiedCount} legacy FAQ(s) with ${mainCollege.name}`);
      }

      const unassignedDocs = await Document.updateMany(
        { $or: [{ collegeId: null }, { collegeId: { $exists: false } }] },
        { $set: { collegeId: mainCollege._id } }
      );
      if (unassignedDocs.modifiedCount > 0) {
        console.log(`[Migration] Associated ${unassignedDocs.modifiedCount} legacy document(s) with ${mainCollege.name}`);
      }
    }

    // Ensure all colleges have their respective baseline FAQs and notices
    const allColleges = await College.find();
    const collegeMap = {};
    for (const c of allColleges) {
      if (c.slug === "apex-tech") collegeMap["college_apex"] = c._id;
      if (c.slug === "metro-state") collegeMap["college_metro"] = c._id;
      if (c.slug === "horizon-eng") collegeMap["college_horizon"] = c._id;
    }

    for (const [mockId, mongoColId] of Object.entries(collegeMap)) {
      const existingFaqs = await FAQ.countDocuments({ collegeId: mongoColId });
      if (existingFaqs === 0) {
        const faqsToSeed = initialFaqs
          .filter((f) => f.collegeId === mockId)
          .map(({ _id, collegeId, ...rest }) => ({
            ...rest,
            collegeId: mongoColId,
          }));
        if (faqsToSeed.length > 0) {
          await FAQ.insertMany(faqsToSeed);
          console.log(`[Migration] Seeded ${faqsToSeed.length} baseline FAQs for ${mockId}`);
        }
      }

      const existingNotices = await Notice.countDocuments({ collegeId: mongoColId });
      if (existingNotices === 0) {
        const noticesToSeed = initialNotices
          .filter((n) => n.collegeId === mockId)
          .map(({ _id, collegeId, ...rest }) => ({
            ...rest,
            collegeId: mongoColId,
          }));
        if (noticesToSeed.length > 0) {
          await Notice.insertMany(noticesToSeed);
          console.log(`[Migration] Seeded ${noticesToSeed.length} baseline notices for ${mockId}`);
        }
      }
    }
  } catch (err) {
    console.warn("[Migration] College seeding/migration check warning:", err.message);
  }
}

module.exports = { seedAndMigrateColleges };
