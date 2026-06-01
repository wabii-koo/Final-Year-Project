const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_URL, { dialect: 'postgres', logging: false });
async function run() {
  try {
    await sequelize.authenticate();
    console.log('Seeding real data into database...');
    
    // 1. Classrooms
    await sequelize.query('DELETE FROM \"Classrooms\"');
    await sequelize.query('INSERT INTO \"Classrooms\" (class_id, class_level, teacher_id, homeroom_teacher_id, academic_year, created_at) VALUES ' + 
      '(1, \'Grade 1-A\', 3, 3, \'2026\', NOW()), ' +
      '(2, \'Grade 2-B\', 4, 3, \'2026\', NOW())');
    
    // 2. Students
    await sequelize.query('DELETE FROM \"Students\"');
    await sequelize.query('INSERT INTO \"Students\" (full_name, class_id, dob, emergency_contact, created_at) VALUES ' +
      '(\'Abebe Bikila\', 1, \'2018-05-15\', \'0911223344\', NOW()), ' +
      '(\'Sara Solomon\', 1, \'2018-08-20\', \'0911223344\', NOW()), ' +
      '(\'Dawit Haile\', 1, \'2018-03-10\', \'0911223344\', NOW()), ' +
      '(\'Martha Kebede\', 2, \'2017-02-12\', \'0911223344\', NOW()), ' +
      '(\'Samuel Yosef\', 2, \'2017-11-30\', \'0911223344\', NOW())');
    
    // 3. Notifications
    await sequelize.query('DELETE FROM notifications');
    await sequelize.query('INSERT INTO notifications (title, content, priority, sender_id, recipient_group, delivery_status, sent_at, created_at) VALUES ' + 
      '(\'Annual Science Fair\', \'The annual science fair will be held this Friday in the auditorium.\', \'normal\', 3, \'all_guardians\', \'sent\', NOW(), NOW()), ' +
      '(\'School Closure\', \'School will be closed next Monday for public holiday.\', \'normal\', 3, \'all_guardians\', \'sent\', NOW(), NOW())');
      
    // 4. Events
    await sequelize.query('DELETE FROM events');
    await sequelize.query('INSERT INTO events (title, description, event_date, event_type, created_by, is_active, target_audience, created_at, updated_at) VALUES ' +
      '(\'Parent-Teacher Meeting\', \'Discuss student progress for Q1.\', NOW() + INTERVAL \'1 day\', \'meeting\', 3, true, \'all\', NOW(), NOW()), ' +
      '(\'Final Exam Week\', \'Exams start next Monday.\', NOW() + INTERVAL \'7 days\', \'exam\', 3, true, \'all\', NOW(), NOW())');

    console.log('Database seeded successfully with real data!');
  } catch(e) { console.log('Error:', e.message); }
  process.exit();
}
run();
