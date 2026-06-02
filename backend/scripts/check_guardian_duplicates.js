#!/usr/bin/env node
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.DB_URL;

if (!dbUrl) {
  console.error('DB_URL not set in backend/.env');
  process.exit(1);
}

const client = new Client({ connectionString: dbUrl });

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');

    console.log('\n1) Students with more than one APPROVED GuardianRegistration (student_id):');
    const dupStudents = await client.query(`
      SELECT student_id, COUNT(*) AS approved_registrations
      FROM "GuardianRegistrations"
      WHERE status = 'approved' AND student_id IS NOT NULL
      GROUP BY student_id
      HAVING COUNT(*) > 1
      ORDER BY approved_registrations DESC
      LIMIT 100;
    `);
    console.log(JSON.stringify(dupStudents.rows, null, 2));

    if (dupStudents.rows.length === 0) {
      console.log('\nNo students found with >1 approved guardian registrations.');
    } else {
      for (const row of dupStudents.rows) {
        const sid = row.student_id;
        console.log(`\n-- Details for student_id=${sid} --`);

        const studentsRow = await client.query('SELECT * FROM "Students" WHERE student_id = $1', [sid]);
        console.log('\nStudents table rows:');
        console.log(JSON.stringify(studentsRow.rows, null, 2));

        const regs = await client.query('SELECT * FROM "GuardianRegistrations" WHERE student_id = $1 ORDER BY created_at DESC', [sid]);
        console.log('\nGuardianRegistrations linked to this student:');
        console.log(JSON.stringify(regs.rows, null, 2));
      }
    }

    console.log('\n2) Potential duplicate Students by name + dob:');
    const dupByNameDob = await client.query(`
      SELECT full_name, dob, array_agg(student_id) AS ids, COUNT(*) AS cnt
      FROM "Students"
      GROUP BY full_name, dob
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC
      LIMIT 100;
    `);
    console.log(JSON.stringify(dupByNameDob.rows, null, 2));

    console.log('\nDiagnostics complete.');
  } catch (err) {
    console.error('Error running diagnostics:', err.stack || err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

run();
