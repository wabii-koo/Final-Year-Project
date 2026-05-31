// fetch_users.js – prints all users who are teachers or have other roles
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
    const [users] = await sequelize.query('SELECT user_id, email, full_name, role FROM users');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await sequelize.close();
  }
})();
