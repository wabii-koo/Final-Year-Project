// test_subquery_raw.js – runs the exact query from teacherController.ts to debug student counts
require('dotenv').config();
const { Sequelize } = require('sequelize');

const dbUrl = process.env.DB_URL;
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // Run the exact query for teacher_id = 3 (Ms. Sarah Smith)
    const [results] = await sequelize.query(`
      SELECT DISTINCT
        c.class_id as id,
        c.class_id as "classId",
        c.class_level as "classLevel",
        c.class_level as "className",
        c.academic_year as "academicYear",
        c.subject as "subject",
        c.homeroom_teacher_id as "homeroomTeacherId",
        (SELECT COUNT(*) FROM "Students" s WHERE s.class_id IN (SELECT class_id FROM "Classrooms" WHERE class_level = c.class_level)) as "totalStudents"
      FROM "Classrooms" c
      WHERE c.teacher_id = 3
      ORDER BY c.class_level
    `);

    console.log('Query results:', results);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await sequelize.close();
  }
})();
