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

    const res = await client.query(`
      SELECT * FROM "GuardianRegistrations"
      WHERE
        (rejection_reason ILIKE '%remediation%')
        OR (rejection_reason ILIKE '%Auto-rejected duplicate%')
        OR (rejection_reason ILIKE '%Orphan student_id cleared%')
        OR (reviewed_at >= NOW() - INTERVAL '1 day')
        OR (student_id IS NULL AND rejection_reason ILIKE '%Orphan%')
      ORDER BY created_at DESC
      LIMIT 200;
    `);

    console.log(`Found ${res.rowCount} registrations matching remediation criteria:\n`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error listing remediation changes:', err.stack || err);
  } finally {
    await client.end();
  }
}

run();
