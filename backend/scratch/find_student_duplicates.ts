import { sequelize } from '../src/database/connection';

async function main() {
  await sequelize.authenticate();
  console.log('DB Connection successful');
  const [res] = await sequelize.query(`
    SELECT s.student_id as "studentId", s.full_name as "fullName", s.guardian_id as "guardianId", s.class_id as "classId", u.full_name as "guardianName"
    FROM "Students" s
    LEFT JOIN users u ON s.guardian_id = u.user_id
    ORDER BY s.full_name
  `);
  console.log('Students List:');
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
