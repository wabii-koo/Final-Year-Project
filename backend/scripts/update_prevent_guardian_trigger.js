#!/usr/bin/env node
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.DB_URL;
if (!dbUrl) { console.error('DB_URL not set in backend/.env'); process.exit(1); }

const client = new Client({ connectionString: dbUrl });

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');

    // Replace function: allow clearing guardian_id (set to NULL), but prevent changing to a different non-null guardian
    await client.query(`
      CREATE OR REPLACE FUNCTION prevent_guardian_overwrite()
      RETURNS trigger AS $$
      BEGIN
        -- Only prevent changing from one non-null guardian to another non-null guardian.
        IF (OLD.guardian_id IS NOT NULL) AND (NEW.guardian_id IS NOT NULL) AND (NEW.guardian_id IS DISTINCT FROM OLD.guardian_id) THEN
          RAISE EXCEPTION 'Student % already has a guardian (user_id=%). Clear guardian_id explicitly before reassignment.', NEW.student_id, OLD.guardian_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`DROP TRIGGER IF EXISTS trg_prevent_guardian_overwrite ON "Students";`);
    await client.query(`
      CREATE TRIGGER trg_prevent_guardian_overwrite
      BEFORE UPDATE ON "Students"
      FOR EACH ROW
      EXECUTE FUNCTION prevent_guardian_overwrite();
    `);

    console.log('Trigger function updated to allow clearing guardian_id.');
  } catch (err) {
    console.error('Error updating trigger function:', err.stack || err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

run();
