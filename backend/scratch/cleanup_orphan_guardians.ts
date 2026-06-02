import { sequelize } from '../src/database/connection';
import { UserModel } from '../src/models/User';

async function main() {
  await sequelize.authenticate();
  console.log('Connected to Database');

  const transaction = await sequelize.transaction();
  try {
    const orphanIds = [19, 22, 24, 25, 26, 30, 31];
    
    console.log(`Starting cleanup of orphan user IDs: ${orphanIds.join(', ')}`);
    
    let deletedCount = 0;
    for (const id of orphanIds) {
      const user = await UserModel.findByPk(id, { transaction });
      if (user) {
        console.log(`Deleting duplicate guardian user ID ${id}: ${user.fullName} (${user.email})...`);
        await user.destroy({ transaction });
        deletedCount++;
      } else {
        console.log(`User ID ${id} already deleted or not found.`);
      }
    }

    await transaction.commit();
    console.log(`🎉 Cleanup successful! Permanently deleted ${deletedCount} duplicate orphan guardian users.`);
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
