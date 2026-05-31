import { sequelize } from '../src/database/connection';

async function listAllTables() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');
    const [res] = await sequelize.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);
    console.log('All Tables:', JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listAllTables();
