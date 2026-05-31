const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function check() {
  try {
    await sequelize.authenticate();
    const res = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('--- TABLES IN DB ---');
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit();
}
check();
