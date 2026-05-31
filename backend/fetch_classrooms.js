// fetch_classrooms.js – prints all classroom records
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});

(async () => {
  try {
    await sequelize.authenticate();
    const [classrooms] = await sequelize.query('SELECT * FROM "Classrooms"');
    console.log(JSON.stringify(classrooms, null, 2));
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await sequelize.close();
  }
})();
