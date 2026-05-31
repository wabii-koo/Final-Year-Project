// assign_homeroom_teachers.js – assigns each classroom to its respective homeroom teacher
require('dotenv').config();
const { Sequelize } = require('sequelize');

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
  console.error('❌ Error: DB_URL is not defined in your .env file.');
  process.exit(1);
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // Assign Grade 1-A (ID 1) to Ms. Sarah Smith (ID 3)
    await sequelize.query(
      'UPDATE "Classrooms" SET teacher_id = 3, homeroom_teacher_id = 3 WHERE class_id = 1'
    );
    console.log('✅ Assigned Grade 1-A to Ms. Sarah Smith (ID 3)');

    // Assign Grade 2-B (ID 2) to Mr. James Johnson (ID 4)
    await sequelize.query(
      'UPDATE "Classrooms" SET teacher_id = 4, homeroom_teacher_id = 4 WHERE class_id = 2'
    );
    console.log('✅ Assigned Grade 2-B to Mr. James Johnson (ID 4)');

    // Assign Grade 3-B (ID 3) to Mrs. Emily Davis (ID 13)
    await sequelize.query(
      'UPDATE "Classrooms" SET teacher_id = 13, homeroom_teacher_id = 13 WHERE class_id = 3'
    );
    console.log('✅ Assigned Grade 3-B to Mrs. Emily Davis (ID 13)');

  } catch (err) {
    console.error('❌ Error updating classrooms:', err);
  } finally {
    await sequelize.close();
  }
})();
