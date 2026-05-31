// seed_classroom_mappings.js – sets up subject-teacher classroom rows in the database
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

    // 1. Clear existing rows that have subjects defined to avoid duplicates
    await sequelize.query('DELETE FROM "Classrooms" WHERE subject IS NOT NULL');
    console.log('✅ Cleaned up old subject teacher mappings.');

    // 2. Insert new mappings
    const mappings = [
      // Grade 1-A mappings:
      {
        classLevel: 'Grade 1-A',
        teacherId: 16, // Dr. Lisa Green
        homeroomTeacherId: 3, // Ms. Sarah Smith
        academicYear: '2024',
        subject: 'Science'
      },
      {
        classLevel: 'Grade 1-A',
        teacherId: 17, // Ms. Karen White
        homeroomTeacherId: 3, // Ms. Sarah Smith
        academicYear: '2024',
        subject: 'English Language'
      },
      // Grade 2-B mappings:
      {
        classLevel: 'Grade 2-B',
        teacherId: 15, // Mr. Robert Miller
        homeroomTeacherId: 4, // Mr. James Johnson
        academicYear: '2024',
        subject: 'Mathematics'
      },
      {
        classLevel: 'Grade 2-B',
        teacherId: 17, // Ms. Karen White
        homeroomTeacherId: 4, // Mr. James Johnson
        academicYear: '2024',
        subject: 'English Language'
      },
      // Grade 3-B mappings:
      {
        classLevel: 'Grade 3-B',
        teacherId: 15, // Mr. Robert Miller
        homeroomTeacherId: 13, // Mrs. Emily Davis
        academicYear: '2026',
        subject: 'Mathematics'
      },
      {
        classLevel: 'Grade 3-B',
        teacherId: 16, // Dr. Lisa Green
        homeroomTeacherId: 13, // Mrs. Emily Davis
        academicYear: '2026',
        subject: 'Science'
      }
    ];

    for (const mapping of mappings) {
      await sequelize.query(
        `INSERT INTO "Classrooms" (class_level, teacher_id, homeroom_teacher_id, academic_year, subject, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        {
          replacements: [
            mapping.classLevel,
            mapping.teacherId,
            mapping.homeroomTeacherId,
            mapping.academicYear,
            mapping.subject
          ]
        }
      );
      console.log(`✅ Mapped ${mapping.classLevel} to Teacher ID ${mapping.teacherId} for Subject: ${mapping.subject}`);
    }

    console.log('🎉 Classroom subject-teacher mappings seeded successfully!');

  } catch (err) {
    console.error('❌ Error mapping classrooms:', err);
  } finally {
    await sequelize.close();
  }
})();
