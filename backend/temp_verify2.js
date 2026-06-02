require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_URL || '', { dialect: 'postgres', logging: false, dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } });
(async () => {
  try {
    await sequelize.authenticate();
    const list = [
      { email: 'robert.miller@school.com', password: 'MillerMath@2026' },
      { email: 'lisa.green@school.com', password: 'GreenScience@2026' },
      { email: 'karen.white@school.com', password: 'WhiteEnglish@2026' },
    ];
    for (const item of list) {
      const [rows] = await sequelize.query('SELECT password_hash FROM users WHERE email = ? LIMIT 1', { replacements: [item.email] });
      const hash = rows[0]?.password_hash;
      const ok = hash ? await bcrypt.compare(item.password, hash) : false;
      console.log(item.email, ok ? 'MATCH' : 'FAIL');
    }
    await sequelize.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
