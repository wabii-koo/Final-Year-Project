/**
 * seed-teachers.js
 * 
 * Upserts the 3 distinct homeroom teachers into the live database and
 * assigns them as homeroom teachers for their respective classrooms.
 * Safe to re-run (uses ON CONFLICT DO UPDATE).
 *
 * Run with:  node scripts/seed-teachers.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_URL || '', {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

// ── Teacher definitions ──────────────────────────────────────────────────────
//  user_id | email                    | password          | full_name           | class
//  3       | sarah.smith@school.com   | Smith1A@2026      | Ms. Sarah Smith     | Grade 1A
//  4       | james.johnson@school.com | Johnson2B@2026    | Mr. James Johnson   | Grade 2B
//  13      | emily.davis@school.com   | Davis3B@2026      | Mrs. Emily Davis    | Grade 3B

const teachers = [
  { userId: 3,  email: 'sarah.smith@school.com',   password: 'Smith1A@2026',   name: 'Ms. Sarah Smith',   role: 'homeroom_teacher', class: 'Grade 1A' },
  { userId: 4,  email: 'james.johnson@school.com', password: 'Johnson2B@2026', name: 'Mr. James Johnson', role: 'homeroom_teacher', class: 'Grade 2B' },
  { userId: 13, email: 'emily.davis@school.com',   password: 'Davis3B@2026',   name: 'Mrs. Emily Davis',  role: 'homeroom_teacher', class: 'Grade 3B' },
  { userId: 15, email: 'robert.miller@school.com', password: 'MillerMath@2026', name: 'Mr. Robert Miller', role: 'teacher', class: 'Grade 1A & 3B' },
  { userId: 16, email: 'lisa.green@school.com',    password: 'GreenScience@2026', name: 'Dr. Lisa Green',     role: 'teacher', class: 'Grade 1A & 2B' },
  { userId: 17, email: 'karen.white@school.com',   password: 'WhiteEnglish@2026', role: 'teacher', name: 'Ms. Karen White',   class: 'Grade 2B & 3B' },
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // 1. Upsert each teacher into users
    for (const t of teachers) {
      const hashedPassword = await bcrypt.hash(t.password, 12);

      await sequelize.query(`
        INSERT INTO users (user_id, email, password_hash, role, full_name, is_active, created_at, phone_no, address)
        VALUES (:userId, :email, :passwordHash, :role, :name, true, NOW(), '', '')
        ON CONFLICT (user_id) DO UPDATE
          SET email         = EXCLUDED.email,
              password_hash = EXCLUDED.password_hash,
              role          = EXCLUDED.role,
              full_name     = EXCLUDED.full_name,
              is_active     = true
      `, { replacements: { userId: t.userId, email: t.email, passwordHash: hashedPassword, role: t.role, name: t.name } });

      console.log(`  ✔ Upserted user ${t.userId}: ${t.name} <${t.email}>`);
    }

    // 2. Show current classrooms
    const [classrooms] = await sequelize.query(
      'SELECT class_id, class_level, homeroom_teacher_id, teacher_id FROM "Classrooms" ORDER BY class_level'
    );
    
    console.log('\n📋 Current classrooms:');
    if (classrooms.length === 0) {
      console.log('   (no classrooms found — creating sample classrooms)\n');
      
      // Create classrooms if they don't exist yet
      const classroomDefs = [
        { level: 'Grade 1A', homeroomId: 3,  teacherId: 3  },
        { level: 'Grade 2B', homeroomId: 4,  teacherId: 4  },
        { level: 'Grade 3B', homeroomId: 13, teacherId: 13 },
      ];

      for (const c of classroomDefs) {
        await sequelize.query(`
          INSERT INTO "Classrooms" (class_level, homeroom_teacher_id, teacher_id, academic_year, created_at)
          VALUES (:level, :homeroomId, :teacherId, '2025-2026', NOW())
          ON CONFLICT DO NOTHING
        `, { replacements: c });
        console.log(`  ✔ Created classroom: ${c.level}`);
      }
    } else {
      classrooms.forEach(c => {
        console.log(`   [${c.class_id}] ${c.class_level}  homeroom=${c.homeroom_teacher_id}  teacher=${c.teacher_id}`);
      });

      // 3. Assign homeroom teachers to matching classrooms only
      console.log('\n🔧 Assigning homeroom teachers to classrooms...');
      for (const t of teachers.filter(t => t.role === 'homeroom_teacher')) {
        const matching = classrooms.filter(c => {
          if (!c.class_level) return false;
          const normalizedDbClass = c.class_level.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normalizedTargetClass = t.class.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedDbClass.includes(normalizedTargetClass) || normalizedTargetClass.includes(normalizedDbClass);
        });

        if (matching.length > 0) {
          for (const c of matching) {
            await sequelize.query(
              'UPDATE "Classrooms" SET homeroom_teacher_id = :teacherId, teacher_id = :teacherId WHERE class_id = :classId',
              { replacements: { teacherId: t.userId, classId: c.class_id } }
            );
            console.log(`  ✔ Assigned ${t.name} (Homeroom & Subject) → classroom [${c.class_id}] ${c.class_level}`);
          }
        } else {
          console.log(`  ⚠  No existing classroom matched "${t.class}" — skipped`);
        }
      }
    }

    // 4. Verify final state
    const [final] = await sequelize.query(`
      SELECT c.class_id, c.class_level, u.full_name as homeroom_teacher, u.email
      FROM "Classrooms" c
      LEFT JOIN users u ON c.homeroom_teacher_id = u.user_id
      ORDER BY c.class_level
    `);

    console.log('\n✅ Final classroom assignments:');
    final.forEach(r => {
      console.log(`   ${r.class_level}  →  ${r.homeroom_teacher || 'UNASSIGNED'} (${r.email || '-'})`);
    });

    console.log('\n🎉 Seed complete!');
    console.log('\n─── Login credentials ─────────────────────────────────');
    console.log('  Grade 1A │ sarah.smith@school.com   │ Smith1A@2026');
    console.log('  Grade 2B │ james.johnson@school.com │ Johnson2B@2026');
    console.log('  Grade 3B │ emily.davis@school.com   │ Davis3B@2026');
    console.log('────────────────────────────────────────────────────────');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
