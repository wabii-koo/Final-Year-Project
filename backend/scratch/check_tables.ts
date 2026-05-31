import { sequelize } from '../src/database/connection';

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('Tables in DB:', JSON.stringify(tables, null, 2));

    // Also count rows in classrooms vs Classrooms
    try {
      const [classroomsUnquoted] = await sequelize.query('SELECT count(*) as count FROM classrooms');
      console.log('classrooms (lowercase) count:', classroomsUnquoted[0]);
    } catch (e) {
      console.log('classrooms (lowercase) does not exist or failed');
    }

    try {
      const [classroomsQuoted] = await sequelize.query('SELECT count(*) as count FROM "Classrooms"');
      console.log('"Classrooms" (quoted) count:', classroomsQuoted[0]);
    } catch (e) {
      console.log('"Classrooms" (quoted) does not exist or failed');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTables();
