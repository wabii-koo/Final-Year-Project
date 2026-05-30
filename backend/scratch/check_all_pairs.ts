import { sequelize } from '../src/database/connection';

async function main() {
  await sequelize.authenticate();
  console.log('Connected to DB');

  const pairs = [
    { name: 'Abebe Kebede', orphanId: 19, mainId: 7 },
    { name: 'Haile Yesuf', orphanId: 36, mainId: 13 },
    { name: 'Kebede Samuel', orphanId: 25, mainId: 9 },
    { name: 'Netsanet Bekele', orphanId: 38, mainId: 12 },
    { name: 'nikat desta', orphanId: 20, mainId: 8 },
    { name: 'welebe kebede', orphanId: 18, mainId: 11 }
  ];

  for (const pair of pairs) {
    console.log(`\n--- ${pair.name} ---`);
    for (const [type, id] of [['Orphan (No Guardian)', pair.orphanId], ['Main (Has Guardian)', pair.mainId]] as const) {
      // Check ReportCards
      const [rc] = await sequelize.query(`SELECT COUNT(*) as count FROM "ReportCards" WHERE student_id = ?`, {
        replacements: [id]
      }) as any;

      // Check PickupRequests
      const [pr] = await sequelize.query(`SELECT COUNT(*) as count FROM "PickupRequests" WHERE student_id = ?`, {
        replacements: [id]
      }) as any;

      // Check GuardianRegistrations
      const [gr] = await sequelize.query(`SELECT COUNT(*) as count FROM "GuardianRegistrations" WHERE student_id = ?`, {
        replacements: [id]
      }) as any;

      console.log(`  ${type} (ID: ${id}):`);
      console.log(`    Report Cards: ${rc[0].count}`);
      console.log(`    Pickup Requests: ${pr[0].count}`);
      console.log(`    Guardian Registrations: ${gr[0].count}`);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
