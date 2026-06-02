import { sequelize } from '../src/database/connection';

async function main() {
  await sequelize.authenticate();
  console.log('Connected to DB');

  const [regs] = await sequelize.query(`
    SELECT registration_id, full_name, email, student_id, student_name, status 
    FROM "GuardianRegistrations" 
    WHERE student_id = 94 OR student_id = 92 OR student_id IS NULL
    ORDER BY student_id
  `);

  console.log('Guardian Registrations matching query:');
  console.log(JSON.stringify(regs, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
