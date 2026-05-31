// Link CSV students to classroom IDs based on classLevel using raw SQL queries
require('dotenv').config();
const fs = require('fs');
const path = require('path');
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

    const csvPath = 'd:/final-project/students_template.csv';
    const raw = fs.readFileSync(csvPath, 'utf8').trim();
    const rows = raw.split('\n').slice(1); // skip header

    for (const row of rows) {
      if (!row.trim()) continue;
      const parts = row.split(',').map(v => v.trim());
      if (parts.length < 4) continue;
      const [fullName, dob, emergencyContact, classLevel] = parts;

      // Find classroom by class_level
      const [classrooms] = await sequelize.query(
        'SELECT class_id FROM "Classrooms" WHERE class_level = ? LIMIT 1',
        { replacements: [classLevel] }
      );

      if (classrooms.length === 0) {
        console.warn(`⚠️ No classroom record found for level "${classLevel}" – skipping ${fullName}`);
        continue;
      }

      const classId = classrooms[0].class_id;

      // Update student's class_id
      const [result, metadata] = await sequelize.query(
        'UPDATE "Students" SET class_id = ? WHERE full_name = ?',
        { replacements: [classId, fullName] }
      );

      console.log(`✅ Processed "${fullName}": mapped to classroom "${classLevel}" (ID ${classId})`);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await sequelize.close();
  }
})();
