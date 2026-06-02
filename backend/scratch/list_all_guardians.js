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

    // ─── 1. All approved guardians (users table) with their students & class ───
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  REGISTERED GUARDIANS  →  STUDENTS  →  CLASS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const [guardians] = await sequelize.query(`
      SELECT
        u.user_id          AS guardian_id,
        u.full_name        AS guardian_name,
        u.email            AS guardian_email,
        u.phone_no         AS guardian_phone,
        s.student_id,
        s.full_name        AS student_name,
        s.dob,
        c.class_id,
        c.class_level      AS class_name,
        c.academic_year
      FROM users u
      LEFT JOIN "Students" s  ON s.guardian_id = u.user_id
      LEFT JOIN "Classrooms" c ON c.class_id   = s.class_id
      WHERE u.role = 'guardian'
      ORDER BY u.full_name, s.full_name
    `);

    if (guardians.length === 0) {
      console.log('  ⚠️  No guardians found in the users table.\n');
    } else {
      let currentGuardian = null;
      for (const row of guardians) {
        if (currentGuardian !== row.guardian_id) {
          currentGuardian = row.guardian_id;
          console.log(`👤 GUARDIAN  [ID: ${row.guardian_id}]`);
          console.log(`   Name   : ${row.guardian_name}`);
          console.log(`   Email  : ${row.guardian_email}`);
          console.log(`   Phone  : ${row.guardian_phone || '—'}`);
          console.log(`   Family :`);
        }
        if (row.student_id) {
          console.log(`     ├─ 🧒 Student : ${row.student_name}  (ID: ${row.student_id})  DOB: ${row.dob}`);
          console.log(`     │    Class   : ${row.class_name || '—'}  |  Year: ${row.academic_year || '—'}  (Class ID: ${row.class_id || '—'})`);
        } else {
          console.log(`     └─ (No students linked yet)`);
        }
      }
    }

    // ─── 2. Summary counts ──────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const [[{ total_guardians }]] = await sequelize.query(`
      SELECT COUNT(*) AS total_guardians FROM users WHERE role = 'guardian'
    `);
    const [[{ total_students }]] = await sequelize.query(`
      SELECT COUNT(*) AS total_students FROM "Students" WHERE guardian_id IS NOT NULL
    `);
    const [[{ unlinked_students }]] = await sequelize.query(`
      SELECT COUNT(*) AS unlinked_students FROM "Students" WHERE guardian_id IS NULL
    `);

    console.log(`  Total Guardians (approved & active) : ${total_guardians}`);
    console.log(`  Students linked to a guardian       : ${total_students}`);
    console.log(`  Students NOT yet linked to guardian : ${unlinked_students}`);

    // ─── 3. Pending registrations summary ────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  GUARDIAN REGISTRATION REQUESTS (by status)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const [regStats] = await sequelize.query(`
      SELECT status, COUNT(*) AS count
      FROM "GuardianRegistrations"
      GROUP BY status
      ORDER BY status
    `);

    if (regStats.length === 0) {
      console.log('  No registration requests found.\n');
    } else {
      for (const r of regStats) {
        console.log(`  ${r.status.padEnd(20)} : ${r.count}`);
      }
    }

    // ─── 4. Full pending registrations with student name ─────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ALL REGISTRATION REQUESTS (with linked student & class)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const [regs] = await sequelize.query(`
      SELECT
        gr.registration_id,
        gr.full_name        AS guardian_name,
        gr.email,
        gr.phone_no,
        gr.relationship_type,
        gr.student_name,
        gr.student_id,
        gr.status,
        gr.created_at,
        s.full_name         AS matched_student_name,
        c.class_level       AS class_name,
        c.academic_year
      FROM "GuardianRegistrations" gr
      LEFT JOIN "Students" s   ON s.student_id  = gr.student_id
      LEFT JOIN "Classrooms" c ON c.class_id    = s.class_id
      ORDER BY gr.status, gr.created_at DESC
    `);

    if (regs.length === 0) {
      console.log('  No registration requests.\n');
    } else {
      for (const r of regs) {
        const statusIcon = r.status === 'approved' ? '✅' : r.status === 'rejected' ? '❌' : r.status === 'pending' ? '⏳' : r.status === 'locked' ? '🔒' : '⚠️ ';
        console.log(`  ${statusIcon} [${r.registration_id}] ${r.guardian_name}`);
        console.log(`      Email        : ${r.email}`);
        console.log(`      Phone        : ${r.phone_no}`);
        console.log(`      Relationship : ${r.relationship_type}`);
        console.log(`      Student Name : ${r.student_name} ${r.matched_student_name ? `→ matched: ${r.matched_student_name}` : '(not matched yet)'}`);
        console.log(`      Class        : ${r.class_name || '—'}  |  Year: ${r.academic_year || '—'}`);
        console.log(`      Status       : ${r.status}`);
        console.log(`      Applied At   : ${new Date(r.created_at).toLocaleString()}`);
        console.log();
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message || err);
  } finally {
    await sequelize.close();
  }
}

run();
