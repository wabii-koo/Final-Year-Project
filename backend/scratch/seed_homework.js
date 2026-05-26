// Seed proper homework data matching actual class names in DB
// Run: node -r dotenv/config scratch/seed_homework.js

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  await client.connect();
  console.log('Connected to DB');

  // 1. Assign guardian (user_id=5, "John Doe") to some students
  await client.query(`UPDATE "Students" SET guardian_id = 5 WHERE full_name IN ('Abebe Bikila', 'Sara Solomon')`);
  console.log('Linked guardian John Doe (id=5) to Abebe Bikila & Sara Solomon');

  // 2. Fix the existing broken homework class_name and add more
  await client.query(`DELETE FROM "Homework"`);
  await client.query(`
    INSERT INTO "Homework" (title, description, subject, class_name, teacher_id, due_date, is_active, created_at, updated_at) VALUES
    ('Practice Letters A-Z', 'Practice writing uppercase and lowercase letters A through Z in your notebook.', 'English', 'Grade 1-A', 3, NOW() + INTERVAL '3 days', true, NOW(), NOW()),
    ('Count to 20', 'Practice counting numbers from 1 to 20 using objects at home.', 'Mathematics', 'Grade 1-A', 3, NOW() + INTERVAL '2 days', true, NOW(), NOW()),
    ('Draw Your Family', 'Draw a picture of your family members and label each person.', 'Art', 'Grade 1-A', 3, NOW() + INTERVAL '5 days', true, NOW(), NOW()),
    ('Basic Addition', 'Practice addition problems from 1+1 to 5+5 in your workbook.', 'Mathematics', 'Grade 2-B', 4, NOW() + INTERVAL '3 days', true, NOW(), NOW()),
    ('Read Story Book', 'Read the assigned story book and write two sentences about your favourite part.', 'English', 'Grade 2-B', 4, NOW() + INTERVAL '4 days', true, NOW(), NOW())
  `);
  console.log('Seeded 5 homework assignments with correct class names');

  const { rows } = await client.query(`SELECT homework_id, title, class_name FROM "Homework"`);
  console.log('Homework in DB:', rows);

  const { rows: students } = await client.query(`SELECT student_id, guardian_id, full_name FROM "Students"`);
  console.log('Students:', students);

  await client.end();
  console.log('Done!');
}

seed().catch(e => { console.error(e); process.exit(1); });
