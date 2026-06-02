#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.DB_URL;
if (!dbUrl) { console.error('DB_URL not set in backend/.env'); process.exit(1); }

const client = new Client({ connectionString: dbUrl });

function toCsvRow(obj, headers) {
  return headers.map(h => {
    const v = obj[h];
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    if (s.includes(',') || s.includes('\n') || s.includes('"')) return `"${s}"`;
    return s;
  }).join(',') + '\n';
}

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
        OR (reviewed_at >= NOW() - INTERVAL '7 day')
        OR (student_id IS NULL AND rejection_reason ILIKE '%Orphan%')
      ORDER BY created_at DESC
      LIMIT 1000;
    `);

    if (res.rowCount === 0) {
      console.log('No remediation rows found to export.');
      return;
    }

    const rows = res.rows;
    const exportDir = path.resolve(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
    const now = new Date().toISOString().replace(/[:.]/g, '-');
    const csvPath = path.join(exportDir, `remediation_backup_${now}.csv`);

    const headers = Object.keys(rows[0]);
    const stream = fs.createWriteStream(csvPath, { encoding: 'utf8' });
    stream.write(headers.join(',') + '\n');
    for (const r of rows) stream.write(toCsvRow(r, headers));
    stream.end();
    console.log(`Exported ${rows.length} rows to ${csvPath}`);

    // Archive them: set status='locked' and append note to rejection_reason
    const ids = rows.map(r => r.registration_id);
    const note = `Archived by remediation export on ${new Date().toISOString()}`;
    const upd = await client.query(
      `UPDATE "GuardianRegistrations"
       SET status = 'locked',
           rejection_reason = CASE WHEN rejection_reason IS NULL OR rejection_reason = '' THEN $2 ELSE rejection_reason || ' | ' || $2 END,
           reviewed_at = NOW()
       WHERE registration_id = ANY($1::int[])
       RETURNING registration_id, status, rejection_reason`,
      [ids, note]
    );

    console.log(`Archived ${upd.rowCount} registrations.`);
    console.log('Archived registration IDs:', upd.rows.map(r => r.registration_id).join(','));
    console.log('CSV file path:', csvPath);
  } catch (err) {
    console.error('Error exporting/archiving remediation rows:', err.stack || err);
  } finally {
    await client.end();
  }
}

run();
