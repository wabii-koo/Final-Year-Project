const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const { rows } = await client.query('SELECT user_id, email, role, full_name FROM users');
  console.log('Seeded Users:');
  console.log(rows);

  const { rows: classrooms } = await client.query('SELECT * FROM "Classrooms"');
  console.log('Classrooms:');
  console.log(classrooms);

  const { rows: homework } = await client.query('SELECT * FROM "Homework"');
  console.log('Homework:');
  console.log(homework);
  await client.end();
}

main().catch(console.error);
