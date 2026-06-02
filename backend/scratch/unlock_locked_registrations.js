require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to DB\n');

    // Show locked records before
    const [locked] = await sequelize.query(`
      SELECT registration_id, full_name, email, student_name, status, correction_attempts
      FROM "GuardianRegistrations"
      WHERE status = 'locked'
      ORDER BY registration_id
    `);

    console.log(`🔒 Found ${locked.length} locked registration(s):\n`);
    for (const r of locked) {
      console.log(`  [${r.registration_id}] ${r.full_name} — Student: "${r.student_name}" — Attempts left: ${r.correction_attempts}`);
    }

    if (locked.length === 0) {
      console.log('  Nothing to unlock.');
      return;
    }

    // Unlock all locked registrations → reset to 'pending' with fresh correction attempts
    const [result] = await sequelize.query(`
      UPDATE "GuardianRegistrations"
      SET status = 'pending',
          correction_attempts = 2,
          rejection_reason = NULL
      WHERE status = 'locked'
    `);

    console.log(`\n✅ Successfully unlocked ${locked.length} registration(s). Status reset to 'pending', correction attempts reset to 2.\n`);

    // Verify
    const [afterUnlock] = await sequelize.query(`
      SELECT registration_id, full_name, email, student_name, status, correction_attempts
      FROM "GuardianRegistrations"
      WHERE registration_id IN (${locked.map(r => r.registration_id).join(',')})
      ORDER BY registration_id
    `);

    console.log('📋 Updated records:');
    for (const r of afterUnlock) {
      console.log(`  ✅ [${r.registration_id}] ${r.full_name} → Status: ${r.status}, Attempts: ${r.correction_attempts}`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message || err);
  } finally {
    await sequelize.close();
  }
}

run();
