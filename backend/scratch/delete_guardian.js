/**
 * Delete Guardian CLI tool
 * Usage: node scratch/delete_guardian.js <guardian_email>
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Please provide the guardian\'s email address.');
  console.log('Usage: node scratch/delete_guardian.js <guardian_email>');
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});

async function deleteGuardian() {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.authenticate();
    console.log('Connected to Database.');

    // 1. Find user by email
    const [users] = await sequelize.query(
      'SELECT user_id, full_name, role FROM users WHERE email = :email',
      { replacements: { email }, transaction }
    );

    if (users.length === 0) {
      console.log(`ℹ️ No user found in "users" table with email: ${email}`);
      // Check if there is at least a registration
      const [regs] = await sequelize.query(
        'SELECT registration_id FROM "GuardianRegistrations" WHERE email = :email',
        { replacements: { email }, transaction }
      );
      if (regs.length > 0) {
        console.log(`Found registration request. Deleting it...`);
        await sequelize.query(
          'DELETE FROM "GuardianRegistrations" WHERE email = :email',
          { replacements: { email }, transaction }
        );
        await transaction.commit();
        console.log('✅ Registration request deleted successfully.');
      } else {
        console.log('❌ No records found for this email.');
        await transaction.rollback();
      }
      process.exit(0);
    }

    const user = users[0];
    if (user.role !== 'guardian') {
      console.error(`❌ Error: User "${user.full_name}" is not a guardian (Role: ${user.role}). Aborting delete.`);
      await transaction.rollback();
      process.exit(1);
    }

    console.log(`Found guardian: "${user.full_name}" (User ID: ${user.user_id})`);

    // 2. Unlink from Students (Set guardian_id = NULL)
    console.log('Unlinking guardian from all students...');
    const [unlinkResult] = await sequelize.query(
      'UPDATE "Students" SET guardian_id = NULL WHERE guardian_id = :userId',
      { replacements: { userId: user.user_id }, transaction }
    );
    console.log('Students unlinked.');

    // 3. Delete from GuardianRegistrations
    console.log('Deleting guardian registrations...');
    await sequelize.query(
      'DELETE FROM "GuardianRegistrations" WHERE email = :email',
      { replacements: { email }, transaction }
    );

    // 4. Delete from PendingRegistrations
    console.log('Deleting pending registrations...');
    await sequelize.query(
      'DELETE FROM "PendingRegistrations" WHERE email = :email',
      { replacements: { email }, transaction }
    );

    // 5. Delete from users (Cascades to message tables, pickup requests, OTPs, etc.)
    console.log('Deleting user account...');
    await sequelize.query(
      'DELETE FROM users WHERE user_id = :userId',
      { replacements: { userId: user.user_id }, transaction }
    );

    await transaction.commit();
    console.log(`\n✅ Guardian "${user.full_name}" (${email}) has been permanently deleted from the database!`);
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Transaction failed and rolled back. Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

deleteGuardian();
