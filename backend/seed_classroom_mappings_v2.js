// seed_classroom_mappings_v2.js – sets up all classroom homeroom and subject mappings in the database based on the verified image, without duplicate subjects
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

    console.log('🧹 Cleaning existing Classrooms...');
    await sequelize.query('DELETE FROM "Classrooms"');

    console.log('🏫 Creating base homeroom classrooms...');
    await sequelize.query(
      `INSERT INTO "Classrooms" (class_id, class_level, teacher_id, homeroom_teacher_id, academic_year, subject, created_at)
       VALUES 
       (1, 'Grade 1-A', 3, 3, '2024', NULL, NOW()),
       (2, 'Grade 2-B', 4, 4, '2024', NULL, NOW()),
       (3, 'Grade 3-B', 13, 13, '2026', NULL, NOW())`
    );

    // Standardized subjects based on image: English, Social Studies, Mathematics, Science
    const subjectMappings = [
      // 1. Ms. Sarah Smith (ID 3) - Grade 1-A & 2-B - English / Soc. Studies
      { classLevel: 'Grade 1-A', teacherId: 3, homeroomTeacherId: 3, academicYear: '2024', subject: 'English' },
      { classLevel: 'Grade 1-A', teacherId: 3, homeroomTeacherId: 3, academicYear: '2024', subject: 'Social Studies' },
      { classLevel: 'Grade 2-B', teacherId: 3, homeroomTeacherId: 4, academicYear: '2024', subject: 'English' },
      { classLevel: 'Grade 2-B', teacherId: 3, homeroomTeacherId: 4, academicYear: '2024', subject: 'Social Studies' },

      // 2. Mr. James Johnson (ID 4) - Grade 2-B & 3-B - Mathematics / Soc. Studies
      { classLevel: 'Grade 2-B', teacherId: 4, homeroomTeacherId: 4, academicYear: '2024', subject: 'Mathematics' },
      { classLevel: 'Grade 2-B', teacherId: 4, homeroomTeacherId: 4, academicYear: '2024', subject: 'Social Studies' },
      { classLevel: 'Grade 3-B', teacherId: 4, homeroomTeacherId: 13, academicYear: '2026', subject: 'Mathematics' },
      { classLevel: 'Grade 3-B', teacherId: 4, homeroomTeacherId: 13, academicYear: '2026', subject: 'Social Studies' },

      // 3. Mrs. Emily Davis (ID 13) - Grade 1-A & 3-B - Science / Soc. Studies
      { classLevel: 'Grade 1-A', teacherId: 13, homeroomTeacherId: 3, academicYear: '2024', subject: 'Science' },
      { classLevel: 'Grade 1-A', teacherId: 13, homeroomTeacherId: 3, academicYear: '2024', subject: 'Social Studies' },
      { classLevel: 'Grade 3-B', teacherId: 13, homeroomTeacherId: 13, academicYear: '2026', subject: 'Science' },
      { classLevel: 'Grade 3-B', teacherId: 13, homeroomTeacherId: 13, academicYear: '2026', subject: 'Social Studies' },

      // 4. Mr. Robert Miller (ID 15) - Grade 1-A & 3-B - Mathematics
      { classLevel: 'Grade 1-A', teacherId: 15, homeroomTeacherId: 3, academicYear: '2024', subject: 'Mathematics' },
      { classLevel: 'Grade 3-B', teacherId: 15, homeroomTeacherId: 13, academicYear: '2026', subject: 'Mathematics' },

      // 5. Dr. Lisa Green (ID 16) - Grade 1-A & 2-B - Science
      { classLevel: 'Grade 1-A', teacherId: 16, homeroomTeacherId: 3, academicYear: '2024', subject: 'Science' },
      { classLevel: 'Grade 2-B', teacherId: 16, homeroomTeacherId: 4, academicYear: '2024', subject: 'Science' },

      // 6. Ms. Karen White (ID 17) - Grade 2-B & 3-B - English
      { classLevel: 'Grade 2-B', teacherId: 17, homeroomTeacherId: 4, academicYear: '2024', subject: 'English' },
      { classLevel: 'Grade 3-B', teacherId: 17, homeroomTeacherId: 13, academicYear: '2026', subject: 'English' }
    ];

    console.log('📝 Inserting subject teacher classroom mappings...');
    for (const mapping of subjectMappings) {
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
    }

    console.log('🎉 Successfully seeded all classroom mappings based on the image without duplicates!');

  } catch (err) {
    console.error('❌ Error mapping classrooms:', err);
  } finally {
    await sequelize.close();
  }
})();
