import { sequelize } from '../src/database/connection';

async function main() {
  await sequelize.authenticate();
  console.log('Connected to DB');

  const userIds = [19, 22, 24, 25, 26, 30, 31];

  for (const id of userIds) {
    console.log(`\nChecking User ID: ${id}`);
    
    // Check Messages
    const [messages] = await sequelize.query(
      `SELECT COUNT(*) as count FROM "messages" WHERE "sender_id" = ? OR "receiver_id" = ?`,
      { replacements: [id, id] }
    ) as any;
    console.log(`  Messages: ${messages[0].count}`);

    // Check SystemLogs
    const [logs] = await sequelize.query(
      `SELECT COUNT(*) as count FROM "SystemLogs" WHERE "user_id" = ?`,
      { replacements: [id] }
    ) as any;
    console.log(`  SystemLogs: ${logs[0].count}`);

    // Check Notifications (lowercase tableName)
    const [notifications] = await sequelize.query(
      `SELECT COUNT(*) as count FROM "notifications" WHERE "sender_id" = ?`,
      { replacements: [id] }
    ) as any;
    console.log(`  Notifications: ${notifications[0].count}`);

    // Check PickupRequests
    const [pickup] = await sequelize.query(
      `SELECT COUNT(*) as count FROM "PickupRequests" WHERE "guardian_id" = ?`,
      { replacements: [id] }
    ) as any;
    console.log(`  PickupRequests: ${pickup[0].count}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
