const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(process.env.DB_URL, { dialect: 'postgres', logging: false });

async function check() {
  try {
    await sequelize.authenticate();
    const [users] = await sequelize.query('SELECT user_id, email, full_name, role FROM users');
    console.log('Users:', users);
  } catch(e) {
    console.log('Error:', e.message);
  }
  process.exit();
}
check();
