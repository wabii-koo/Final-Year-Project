import { sequelize } from '../src/database/connection';

async function main() {
  const transaction = await sequelize.transaction();
  try {
    console.log('Starting duplicate students cleanup...');

    // 1. Migrate PickupRequests for welebe kebede (ID 18 -> ID 11)
    console.log('Migrating PickupRequests from student ID 18 to 11...');
    const [updateResult] = await sequelize.query(
      `UPDATE "PickupRequests" SET student_id = 11 WHERE student_id = 18`,
      { transaction }
    );
    console.log('PickupRequests migrated successfully.');

    // 2. Delete duplicate orphan students
    const duplicateIds = [19, 36, 25, 38, 20, 18];
    console.log(`Deleting duplicate student IDs: ${duplicateIds.join(', ')}...`);
    const [deleteResult] = await sequelize.query(
      `DELETE FROM "Students" WHERE student_id IN (${duplicateIds.join(',')})`,
      { transaction }
    );
    console.log('Duplicate students deleted successfully.');

    // Commit transaction
    await transaction.commit();
    console.log('🎉 Cleanup transaction committed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed, rolling back:', error);
    await transaction.rollback();
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
