require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const [students] = await sequelize.query(
      `SELECT s.student_id, s.full_name as student_name, s.guardian_id, u.full_name as guardian_name, u.email as guardian_email 
       FROM "Students" s
       LEFT JOIN users u ON s.guardian_id = u.user_id`
    );
    console.log('All students and their guardians:');
    console.log(JSON.stringify(students, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

run();
