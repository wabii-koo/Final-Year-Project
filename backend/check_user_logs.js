const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DB_URL, { dialect: 'postgres', logging: false });
async function check() {
  try {
    await sequelize.authenticate();
    console.log('Successfully connected to DB');
    
    const [logs] = await sequelize.query("SELECT * FROM \"SystemLogs\" WHERE action LIKE '%USER%' OR action LIKE '%DELETE%' ORDER BY created_at DESC");
    console.log('User/Delete Logs:');
    console.log(logs);

  } catch(e) {
    console.log('Error:', e.message);
  }
  process.exit();
}
check();
