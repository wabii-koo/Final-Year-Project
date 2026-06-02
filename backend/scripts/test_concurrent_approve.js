#!/usr/bin/env node
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const dbUrl = process.env.DB_URL;
if (!dbUrl) { console.error('DB_URL not set'); process.exit(1); }

const client = new Client({ connectionString: dbUrl });

async function attemptApprove(label, studentId) {
  const client2 = new Client({ connectionString: dbUrl });
  await client2.connect();
  try {
    await client2.query('BEGIN');
    const sRes = await client2.query('SELECT guardian_id FROM "Students" WHERE student_id = $1 FOR UPDATE', [studentId]);
    const guardianId = sRes.rows[0].guardian_id;
    if (guardianId) {
      await client2.query('ROLLBACK');
      return { label, status: 'conflict', guardianId };
    }

    // create a dummy user
    const email = `concurrent-test+${label}@example.com`;
    const now = new Date().toISOString();
    const insertRes = await client2.query(
      `INSERT INTO users (email, password_hash, role, full_name, phone_no, address, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING user_id`,
      [email, 'hash', 'guardian', `Concurrent ${label}`, '+1000000000', 'test', true, now]
    );
    const newUserId = insertRes.rows[0].user_id;

    await client2.query('UPDATE "Students" SET guardian_id = $1 WHERE student_id = $2', [newUserId, studentId]);
    await client2.query('COMMIT');
    return { label, status: 'ok', userId: newUserId };
  } catch (err) {
    try { await client2.query('ROLLBACK'); } catch (e) {}
    return { label, status: 'error', error: err.message };
  } finally {
    await client2.end();
  }
}

async function run() {
  await client.connect();
  try {
    // find a student with null guardian_id
    let res = await client.query('SELECT student_id FROM "Students" WHERE guardian_id IS NULL LIMIT 1');
    let createdStudent = false;
    let studentId;
    if (res.rows.length === 0) {
      // create a temporary student (use class_id 1 if exists)
      const classRes = await client.query('SELECT class_id FROM "Classrooms" LIMIT 1');
      const classId = classRes.rows[0] ? classRes.rows[0].class_id : 1;
      const dob = '2010-01-01';
      const name = 'Concurrent Test Student ' + Date.now();
      const ins = await client.query('INSERT INTO "Students" (full_name,dob,emergency_contact,class_id,created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING student_id', [name, dob, 'N/A', classId]);
      studentId = ins.rows[0].student_id;
      createdStudent = true;
    } else {
      studentId = res.rows[0].student_id;
    }

    console.log('Using student_id =', studentId);

    // run two concurrent attempts
    const [r1, r2] = await Promise.all([
      attemptApprove('A', studentId),
      attemptApprove('B', studentId)
    ]);

    console.log('Results:', r1, r2);

    // cleanup: remove any created users and reset guardian_id
    const createdUserIds = [];
    if (r1.status === 'ok') createdUserIds.push(r1.userId);
    if (r2.status === 'ok') createdUserIds.push(r2.userId);
    if (createdUserIds.length > 0) {
      await client.query('UPDATE "Students" SET guardian_id = NULL WHERE student_id = $1', [studentId]);
      await client.query('DELETE FROM users WHERE user_id = ANY($1::int[])', [createdUserIds]);
    }
    if (createdStudent) {
      await client.query('DELETE FROM "Students" WHERE student_id = $1', [studentId]);
    }

  } finally {
    await client.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
