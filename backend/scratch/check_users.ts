import { sequelize } from '../src/database/connection';

async function run() {
  try {
    const [rows] = await sequelize.query(`
      SELECT 
        user_id, 
        email, 
        full_name, 
        role,
        is_active,
        CASE 
          WHEN password_hash IS NULL THEN 'NO PASSWORD'
          WHEN password_hash = '' THEN 'EMPTY'
          ELSE CONCAT('HAS PASSWORD (starts: ', LEFT(password_hash, 7), '...)')
        END as pw_status
      FROM users 
      ORDER BY user_id
      LIMIT 30
    `);
    console.log('\n=== ALL USERS IN DATABASE ===\n');
    console.table(rows);
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await sequelize.close();
  }
}

run();
