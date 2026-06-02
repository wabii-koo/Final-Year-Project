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

    // Start transaction
    await client.query('BEGIN');

    const dupStudentsRes = await client.query(`
      SELECT student_id, COUNT(*) AS approved_registrations
      FROM "GuardianRegistrations"
      WHERE status = 'approved' AND student_id IS NOT NULL
      GROUP BY student_id
      HAVING COUNT(*) > 1
      ORDER BY approved_registrations DESC
      LIMIT 100;
    `);

    const dupStudents = dupStudentsRes.rows;
    if (dupStudents.length === 0) {
      console.log('No students with >1 approved GuardianRegistration found.');
    } else {
      for (const row of dupStudents) {
        const sid = row.student_id;
        console.log(`\nProcessing student_id=${sid} (approved_registrations=${row.approved_registrations})`);

        const studentsRow = await client.query('SELECT * FROM "Students" WHERE student_id = $1', [sid]);

        if (studentsRow.rows.length === 0) {
          // Orphaned registrations -> clear student_id to avoid blocking index creation
          const res = await client.query(
            `UPDATE "GuardianRegistrations"
             SET student_id = NULL,
                 rejection_reason = CASE WHEN rejection_reason IS NULL OR rejection_reason = '' THEN 'Orphan student_id cleared by remediation script' ELSE rejection_reason || ' | Orphan student_id cleared by remediation script' END
             WHERE student_id = $1
             RETURNING registration_id`,
            [sid]
          );
          console.log(`Cleared student_id on ${res.rowCount} registrations for orphan student_id=${sid}`);
        } else {
          // Keep a single approved registration (oldest by created_at) and reject others
          const regsRes = await client.query(
            `SELECT registration_id, created_at
             FROM "GuardianRegistrations"
             WHERE student_id = $1 AND status = 'approved'
             ORDER BY created_at ASC`,
            [sid]
          );
          const regs = regsRes.rows;
          if (regs.length <= 1) {
            console.log(`Nothing to do for student_id=${sid}`);
            continue;
          }
          const keepId = regs[0].registration_id;
          const otherIds = regs.slice(1).map(r => r.registration_id);

          const updRes = await client.query(
            `UPDATE "GuardianRegistrations"
             SET status = 'rejected',
                 rejection_reason = CASE WHEN rejection_reason IS NULL OR rejection_reason = '' THEN 'Auto-rejected duplicate approved registration by remediation script' ELSE rejection_reason || ' | Auto-rejected duplicate approved registration by remediation script' END,
                 reviewed_at = NOW()
             WHERE registration_id = ANY($1::int[])
             RETURNING registration_id`,
            [otherIds]
          );
          console.log(`For student_id=${sid} kept registration_id=${keepId}, rejected ${updRes.rowCount} other registrations: ${updRes.rows.map(r=>r.registration_id).join(',')}`);
        }
      }
    }

    // Commit cleanup
    await client.query('COMMIT');
    console.log('\nCleanup transaction committed.');

    // Now add DB protections: unique partial index and trigger to prevent overwrite
    console.log('\nCreating partial unique index to prevent >1 approved registration per student...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_guardianregistrations_studentid_approved
      ON "GuardianRegistrations" (student_id)
      WHERE status = 'approved' AND student_id IS NOT NULL;
    `);
    console.log('Index created (or already existed).');

    console.log('\nCreating trigger to prevent overwriting Students.guardian_id...');
    await client.query(`
      CREATE OR REPLACE FUNCTION prevent_guardian_overwrite()
      RETURNS trigger AS $$
      BEGIN
        IF (OLD.guardian_id IS NOT NULL) AND (NEW.guardian_id IS DISTINCT FROM OLD.guardian_id) THEN
          RAISE EXCEPTION 'Student % already has a guardian (user_id=%). Clear guardian_id explicitly before reassignment.', NEW.student_id, OLD.guardian_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Drop existing trigger if exists, then create
    await client.query(`DROP TRIGGER IF EXISTS trg_prevent_guardian_overwrite ON "Students";`);
    await client.query(`
      CREATE TRIGGER trg_prevent_guardian_overwrite
      BEFORE UPDATE ON "Students"
      FOR EACH ROW
      EXECUTE FUNCTION prevent_guardian_overwrite();
    `);
    console.log('Trigger created.');

    console.log('\nRemediation complete.');
  } catch (err) {
    console.error('Error during remediation:', err.stack || err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

run();
