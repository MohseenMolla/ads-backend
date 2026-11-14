import connectDB from "../config/db.js";
import Semester from "../models/Semester.js";
import Course from "../models/Course.js";

const seedCourses = async () => {
  try {
    await connectDB();

    let sixth = await Semester.findOne({ title: { $regex: /sixth/i } });
    if (!sixth) {
      sixth = await Semester.create({
        title: "Sixth Semester",
        term: "Mid Term",
        examRoutineUrl: "/exam",
        classRoutineUrl: "/class",
      });
      console.log("Created Sixth Semester in DB");
    }

    const sixthCourses = [
      { code: "ADS 213", title: "Artificial Intelligence" },
      { code: "ADS 214", title: "Artificial Intelligence Lab" },
      { code: "ADS 216", title: "Data Analysis and Visualization" },
      { code: "ADS 217", title: "Internet Protocols and Applications" },
      { code: "ADS 218", title: "Internet Protocols and Applications Lab" },
      { code: "ADS 417", title: "Optimization" },
    ];

    for (const c of sixthCourses) {
      const exists = await Course.findOne({ courseCode: c.code });
      if (!exists) {
        await Course.create({
          semesterId: sixth._id,
          courseTitle: c.title,
          courseCode: c.code,
        });
        console.log("Created course:", c.code, c.title);
      } else if (!exists.semesterId) {
        exists.semesterId = sixth._id;
        await exists.save();
        console.log("Updated course with semesterId:", c.code);
      }
    }

    console.log("All sixth semester courses synced successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedCourses();
