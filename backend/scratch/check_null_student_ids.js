require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres', logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function run() {
  await sequelize.authenticate();

  const [rows] = await sequelize.query(`
    SELECT
      gr.registration_id,
      gr.full_name        AS guardian,
      gr.student_name,
      gr.status,
      s.student_id        AS matched_id,
      s.full_name         AS matched_name
    FROM "GuardianRegistrations" gr
    LEFT JOIN "Students" s
      ON LOWER(TRIM(s.full_name)) = LOWER(TRIM(gr.student_name))
    WHERE gr.student_id IS NULL
    ORDER BY gr.registration_id
  `);

  console.log('Records with NULL student_id and their match result:\n');
  for (const r of rows) {
    const match = r.matched_id
      ? `✅ Matched → Student ID ${r.matched_id} (${r.matched_name})`
      : `❌ No match in Students table`;
    console.log(`  [${r.registration_id}] Guardian: "${r.guardian}" | Student name: "${r.student_name}" | ${match}`);
  }

  await sequelize.close();
}

run().catch(console.error);
