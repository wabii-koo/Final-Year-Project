require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_URL || '', { dialect: 'postgres', logging: false, dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } });
(async () => {
  try {
    await sequelize.authenticate();
    const emails = ['robert.miller@school.com','lisa.green@school.com','karen.white@school.com'];
    for (const email of emails) {
      const [rows] = await sequelize.query('SELECT user_id,email,role,password_hash FROM users WHERE email = ? LIMIT 1', { replacements: [email] });
      console.log('---', email, '---');
      console.dir(rows, { depth: 1 });
    }
    await sequelize.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
