const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DB_URL, { dialect: 'postgres', logging: false });
async function check() {
  try {
    await sequelize.authenticate();
    console.log('Successfully connected to DB');
    
    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
      ORDER BY table_name
    `);
    console.log('All public tables:');
    console.log(tables.map(t => t.table_name));

    // For each table, print the count and check for column info
    for (const t of tables) {
      const tableName = t.table_name;
      try {
        const [cnt] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        console.log(`Table "${tableName}": count = ${cnt[0].count}`);
      } catch (err) {
        console.log(`Error counting "${tableName}": ${err.message}`);
      }
    }
  } catch(e) {
    console.log('Error:', e.message);
  }
  process.exit();
}
check();
