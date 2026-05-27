import { sequelize } from '../src/database/connection';

async function listGuardians() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');
    const [guardians] = await sequelize.query(
      "SELECT user_id, email, full_name, role, password_hash FROM users WHERE role = 'guardian'"
    );
    console.log('Registered Guardians:');
    console.log(JSON.stringify(guardians, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listGuardians();
