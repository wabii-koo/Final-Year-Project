import { sequelize } from '../src/database/connection';

async function main() {
  await sequelize.authenticate();
  console.log('Connected to DB');

  const [users] = await sequelize.query(`
    SELECT user_id, email, full_name, role 
    FROM users 
    WHERE full_name ILIKE '%sara%' OR full_name ILIKE '%tsion%' OR full_name ILIKE '%feleke%'
  `);

  console.log('--- Matching Users ---');
  console.log(JSON.stringify(users, null, 2));

  const [regs] = await sequelize.query(`
    SELECT registration_id, full_name, student_name, email, status 
    FROM "GuardianRegistrations" 
    WHERE full_name ILIKE '%sara%' OR full_name ILIKE '%tsion%' OR full_name ILIKE '%feleke%'
  `);

  console.log('--- Matching Registrations ---');
  console.log(JSON.stringify(regs, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
