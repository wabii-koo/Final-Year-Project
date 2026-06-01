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

    console.log('Deleting user 27 (webiikoo@gmail.com)...');
    const result = await sequelize.query(
      'DELETE FROM users WHERE email = :email OR user_id = 27',
      { replacements: { email: 'webiikoo@gmail.com' } }
    );
    console.log('User deleted:', result);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

run();
