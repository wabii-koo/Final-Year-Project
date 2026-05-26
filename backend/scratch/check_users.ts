import { sequelize } from '../src/database/connection';

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');
    const [res] = await sequelize.query("SELECT user_id, email, role, full_name FROM Users");
    console.log('Users in DB:', JSON.stringify(res, null, 2));

    const [classrooms] = await sequelize.query("SELECT class_id, class_level, teacher_id, homeroom_teacher_id FROM Classrooms");
    console.log('Classrooms in DB:', JSON.stringify(classrooms, null, 2));

    const [students] = await sequelize.query("SELECT student_id, guardian_id, class_id, full_name FROM Students");
    console.log('Students in DB:', JSON.stringify(students, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
