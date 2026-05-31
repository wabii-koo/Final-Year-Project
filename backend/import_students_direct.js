// import_students_direct.js – directly imports students from students_template.csv into "Students" table
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

    // 1. Read and parse CSV file
    const csvPath = 'd:/final-project/students_template.csv';
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found at: ${csvPath}`);
      return;
    }

    const raw = fs.readFileSync(csvPath, 'utf8').trim();
    const rows = raw.split('\n').slice(1); // skip header row

    console.log(`📋 Found ${rows.length} rows in CSV.`);

    // 2. Clear existing students
    console.log('🧹 Clearing existing Students table...');
    await sequelize.query('DELETE FROM "Students"');

    // 3. Import each student
    for (const row of rows) {
      if (!row.trim()) continue;
      const parts = row.split(',').map(v => v.trim());
      if (parts.length < 4) {
        console.warn(`⚠️ Skipping malformed row: ${row}`);
        continue;
      }
      const [fullName, dob, emergencyContact, classLevel] = parts;

      // Skip the malformed template instruction row if present
      if (fullName.toLowerCase().includes('how many') || fullName.toLowerCase().includes('template')) {
        console.log(`ℹ️ Skipping template instruction row: ${fullName}`);
        continue;
      }

      // Find the base classroom where subject IS NULL
      const [classrooms] = await sequelize.query(
        'SELECT class_id FROM "Classrooms" WHERE class_level = ? AND subject IS NULL LIMIT 1',
        { replacements: [classLevel] }
      );

      if (classrooms.length === 0) {
        console.error(`❌ No base classroom found for "${classLevel}". Skipping student "${fullName}".`);
        continue;
      }

      const classId = classrooms[0].class_id;

      // Insert student
      await sequelize.query(
        `INSERT INTO "Students" (full_name, dob, emergency_contact, class_id, guardian_id, created_at)
         VALUES (?, ?, ?, ?, NULL, NOW())`,
        {
          replacements: [fullName, dob, emergencyContact, classId]
        }
      );
      console.log(`✅ Imported ${fullName} to classroom ${classLevel} (ID ${classId})`);
    }

    console.log('🎉 Student import completed successfully!');

    // Print final student count
    const [countResult] = await sequelize.query('SELECT COUNT(*) FROM "Students"');
    console.log(`📊 Total students in DB: ${countResult[0].count}`);

  } catch (err) {
    console.error('❌ Error importing students:', err);
  } finally {
    await sequelize.close();
  }
})();
