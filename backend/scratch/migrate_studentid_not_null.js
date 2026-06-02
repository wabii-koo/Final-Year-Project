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

    // Check for any remaining NULLs in student_id
    const [nullRows] = await sequelize.query(`
      SELECT registration_id, full_name, student_name, status
      FROM "GuardianRegistrations"
      WHERE student_id IS NULL
    `);

    if (nullRows.length > 0) {
      console.log(`⚠️  Found ${nullRows.length} row(s) with NULL student_id. These must be fixed before adding NOT NULL constraint:\n`);
      for (const r of nullRows) {
        console.log(`  [${r.registration_id}] ${r.full_name} — Student: "${r.student_name}" — Status: ${r.status}`);
      }
      console.log('\n❌ Skipping NOT NULL constraint. Please resolve these records first.');
    } else {
      // Safe to add NOT NULL constraint
      await sequelize.query(`
        ALTER TABLE "GuardianRegistrations"
        ALTER COLUMN student_id SET NOT NULL
      `);
      console.log('✅ student_id column is now NOT NULL in the database.\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message || err);
  } finally {
    await sequelize.close();
  }
}

run();
