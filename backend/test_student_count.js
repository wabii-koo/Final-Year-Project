// test_student_count.js – queries student counts manually
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

    const [classrooms] = await sequelize.query('SELECT class_id, class_level FROM "Classrooms"');
    console.log('Classrooms in DB:', classrooms);

    const [studentClassIds] = await sequelize.query('SELECT DISTINCT class_id FROM "Students"');
    console.log('Distinct class_id in Students:', studentClassIds);

    const [subqueryResult] = await sequelize.query(
      `SELECT class_id FROM "Classrooms" WHERE class_level = 'Grade 1-A'`
    );
    console.log('Class IDs for Grade 1-A:', subqueryResult);

    const [count1] = await sequelize.query('SELECT COUNT(*) FROM "Students" WHERE class_id = 1');
    console.log('Students count with class_id = 1:', count1);

    const [countIn] = await sequelize.query(
      `SELECT COUNT(*) FROM "Students" WHERE class_id IN (SELECT class_id FROM "Classrooms" WHERE class_level = 'Grade 1-A')`
    );
    console.log('Students count with class_id IN classrooms of Grade 1-A:', countIn);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await sequelize.close();
  }
})();
