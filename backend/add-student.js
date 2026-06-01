const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
  console.error('Error: DB_URL is not defined in your .env file.');
  process.exit(1);
}

// Get the student name from the command line arguments
const studentName = process.argv.slice(2).join(' ') || 'welebe kebede';

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to the database.');

    // 1. Find or create a classroom to assign the student to
    const [classrooms] = await sequelize.query('SELECT class_id FROM "Classrooms" LIMIT 1');
    let classId;

    if (classrooms.length > 0) {
      classId = classrooms[0].class_id;
      console.log(`🏫 Found existing Classroom ID: ${classId}`);
    } else {
      // If no classrooms exist, create a default one (Grade 1-A)
      console.log('🏫 No classrooms found. Creating a default classroom (Grade 1-A)...');
      const [insertResult] = await sequelize.query(
        `INSERT INTO "Classrooms" (class_level, teacher_id, homeroom_teacher_id, academic_year, created_at) 
         VALUES ('Grade 1-A', 3, 3, '2026', NOW()) RETURNING class_id`
      );
      classId = insertResult[0].class_id;
      console.log(`🏫 Created default Classroom ID: ${classId}`);
    }

    // 2. Check if student already exists
    const [existing] = await sequelize.query(
      'SELECT student_id FROM "Students" WHERE full_name = ?',
      { replacements: [studentName] }
    );

    if (existing.length > 0) {
      console.log(`⚠️ Student "${studentName}" already exists in the database (ID: ${existing[0].student_id}).`);
    } else {
      // 3. Insert the new student
      console.log(`👤 Inserting student "${studentName}"...`);
      await sequelize.query(
        `INSERT INTO "Students" (full_name, class_id, dob, emergency_contact, created_at) 
         VALUES (?, ?, '2018-05-15', '0911223344', NOW())`,
        { replacements: [studentName, classId] }
      );
      console.log(`🎉 Success! Student "${studentName}" has been added to the database.`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

run();
