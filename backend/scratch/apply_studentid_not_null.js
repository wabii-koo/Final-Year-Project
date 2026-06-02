require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres', logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to DB\n');

    // 1. Fix record [22] — Kuma Kebede Soboka → matches Student ID 117 (welebe kebede)
    await sequelize.query(`
      UPDATE "GuardianRegistrations"
      SET student_id = 117
      WHERE registration_id = 22
    `);
    console.log('✅ Fixed [22] Kuma Kebede Soboka → student_id set to 117 (welebe kebede)\n');

    // 2. Delete fake/test records that have student names not in Students table
    const fakeIds = [5, 6, 8, 18, 19];
    await sequelize.query(`
      DELETE FROM "GuardianRegistrations"
      WHERE registration_id IN (${fakeIds.join(',')})
    `);
    console.log(`✅ Deleted ${fakeIds.length} fake/test registrations: [${fakeIds.join(', ')}]\n`);

    // 3. Now apply NOT NULL constraint
    await sequelize.query(`
      ALTER TABLE "GuardianRegistrations"
      ALTER COLUMN student_id SET NOT NULL
    `);
    console.log('✅ student_id is now NOT NULL in the database!\n');

    // 4. Verify — confirm no NULLs remain
    const [[{ count }]] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM "GuardianRegistrations" WHERE student_id IS NULL
    `);
    console.log(`📋 Remaining NULL student_ids: ${count} (should be 0)\n`);

    // 5. Show final state
    const [all] = await sequelize.query(`
      SELECT registration_id, full_name, student_name, student_id, status
      FROM "GuardianRegistrations"
      ORDER BY registration_id
    `);
    console.log('📋 All GuardianRegistrations now:\n');
    for (const r of all) {
      console.log(`  [${r.registration_id}] ${r.full_name} | Student: "${r.student_name}" (ID: ${r.student_id}) | Status: ${r.status}`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message || err);
  } finally {
    await sequelize.close();
  }
}

run();
