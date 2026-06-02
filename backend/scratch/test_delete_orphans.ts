import { sequelize } from '../src/database/connection';
import { UserModel } from '../src/models/User';

async function main() {
  await sequelize.authenticate();
  console.log('Connected to DB');

  const transaction = await sequelize.transaction();
  try {
    const orphanIds = [19, 22, 24, 25, 26, 30, 31];
    
    console.log(`Attempting to delete orphan user IDs: ${orphanIds.join(', ')}`);
    
    for (const id of orphanIds) {
      const user = await UserModel.findByPk(id, { transaction });
      if (user) {
        console.log(`Deleting user ID ${id}: ${user.fullName} (${user.email})...`);
        await user.destroy({ transaction });
      } else {
        console.log(`User ID ${id} not found.`);
      }
    }

    console.log('Simulating successful transaction - rolling back to preserve DB state.');
    await transaction.rollback();
    console.log('Rollback successful.');
    process.exit(0);
  } catch (error) {
    console.error('Error during deletion simulation:', error);
    await transaction.rollback();
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
