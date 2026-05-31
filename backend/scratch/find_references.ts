import { sequelize } from '../src/database/connection';

async function main() {
  await sequelize.authenticate();
  console.log('Connected to DB');

  const duplicateIds = [19, 36, 25, 38, 20, 18];

  for (const id of duplicateIds) {
    console.log(`\nChecking student ID: ${id}`);
    
    // Check ReportCards
    const [rc] = await sequelize.query(`SELECT COUNT(*) as count FROM "ReportCards" WHERE student_id = ?`, {
      replacements: [id]
    }) as any;
    console.log(`  Report Cards: ${rc[0].count}`);

    // Check PickupRequests
    const [pr] = await sequelize.query(`SELECT COUNT(*) as count FROM "PickupRequests" WHERE student_id = ?`, {
      replacements: [id]
    }) as any;
    console.log(`  Pickup Requests: ${pr[0].count}`);

    // Check GuardianRegistrations
    const [gr] = await sequelize.query(`SELECT COUNT(*) as count FROM "GuardianRegistrations" WHERE student_id = ?`, {
      replacements: [id]
    }) as any;
    console.log(`  Guardian Registrations: ${gr[0].count}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
