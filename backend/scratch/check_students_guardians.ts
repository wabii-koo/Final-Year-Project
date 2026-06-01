import { sequelize } from '../src/database/connection';
import { QueryTypes } from 'sequelize';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const registrations = await sequelize.query(`
      SELECT *
      FROM "GuardianRegistrations"
    `, { type: QueryTypes.SELECT });

    console.log('--- Guardian Registrations ---');
    console.log(registrations);

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
