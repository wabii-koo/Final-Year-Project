require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const email = 'webiikoo@gmail.com';
    const phone = '+251999570477';
    const nationalId = '123456789';

    console.log('\n--- Querying users table ---');
    const [users] = await sequelize.query(
      'SELECT * FROM users WHERE email = :email OR phone_no = :phone OR national_id = :nationalId',
      { replacements: { email, phone, nationalId } }
    );
    console.log('users:', users);

    console.log('\n--- Querying GuardianRegistrations table ---');
    const [registrations] = await sequelize.query(
      'SELECT * FROM "GuardianRegistrations" WHERE email = :email OR "phone_no" = :phone OR "national_id" = :nationalId',
      { replacements: { email, phone, nationalId } }
    );
    console.log('GuardianRegistrations:', registrations);

    console.log('\n--- Querying PendingRegistrations table ---');
    const [pending] = await sequelize.query(
      'SELECT * FROM "PendingRegistrations" WHERE email = :email OR "phoneNo" = :phone OR "nationalId" = :nationalId',
      { replacements: { email, phone, nationalId } }
    );
    console.log('PendingRegistrations:', pending);

    console.log('\n--- Querying Students table for guardian_id = 27 ---');
    const [students] = await sequelize.query(
      'SELECT * FROM "Students" WHERE guardian_id = 27'
    );
    console.log('Students linked to user 27:', students);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

run();
