import { sequelize } from '../src/database/connection';
import { GuardianRegistrationModel } from '../src/models/GuardianRegistration';

async function main() {
  await sequelize.authenticate();
  console.log('Connected to Database');

  const transaction = await sequelize.transaction();
  try {
    const regIdsToDelete = [11, 24];
    console.log(`Starting deletion of duplicate registrations: ${regIdsToDelete.join(', ')}`);

    for (const id of regIdsToDelete) {
      const reg = await GuardianRegistrationModel.findByPk(id, { transaction });
      if (reg) {
        console.log(`Deleting duplicate registration ID ${id} for student "${reg.studentName}" (Student ID: ${reg.studentId})...`);
        await reg.destroy({ transaction });
      } else {
        console.log(`Registration ID ${id} not found.`);
      }
    }

    await transaction.commit();
    console.log('🎉 Duplicate registrations deleted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Deletion failed, rolling back:', error);
    await transaction.rollback();
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
