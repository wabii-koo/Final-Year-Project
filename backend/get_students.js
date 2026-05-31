// Temporary script to fetch all students from the DB and print them
const { sequelize } = require('./src/database');
const { Student } = require('./src/models/Student');
(async () => {
  try {
    await sequelize.authenticate();
    const students = await Student.findAll();
    console.log(JSON.stringify(students, null, 2));
  } catch (err) {
    console.error('Error fetching students:', err);
  } finally {
    await sequelize.close();
  }
})();
