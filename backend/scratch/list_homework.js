const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(process.env.DB_URL, { dialect: 'postgres', logging: false });

async function check() {
  try {
    await sequelize.authenticate();
    console.log('DB connected!');
    const [homework] = await sequelize.query('SELECT * FROM "Homework"');
    console.log('Homework entries:', homework);
  } catch(e) {
    console.log('Error:', e.message);
  }
  process.exit();
}
check();
