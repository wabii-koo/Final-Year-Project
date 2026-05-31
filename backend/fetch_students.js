// Script to fetch and print all student records from Supabase PostgreSQL
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

(async () => {
  try {
    await sequelize.authenticate();
    const [students] = await sequelize.query('SELECT student_id, full_name, class_id FROM "Students"');
    console.log(JSON.stringify(students, null, 2));
  } catch (err) {
    console.error('Error fetching students:', err);
  } finally {
    await sequelize.close();
  }
})();
