require('dotenv').config();
const { Op } = require('sequelize');
const { connectDatabase } = require('../src/database/connection');
const StudentModel = require('../src/models/Student').default;
const UserModel = require('../src/models/User').default;
const ClassroomModel = require('../src/models/Classroom').default;

async function run() {
  try {
    await connectDatabase();
    console.log('Database connected and models initialized.');

    const query = 'welebe';
    console.log(`Searching for "${query}"...`);

    const students = await StudentModel.findAll({
      where: {
        fullName: {
          [Op.iLike]: `%${query}%`
        }
      },
      include: [
        {
          model: UserModel,
          as: 'guardian',
          attributes: ['fullName', 'email']
        },
        {
          model: ClassroomModel,
          as: 'classroom',
          attributes: ['classLevel']
        }
      ],
      limit: 20
    });

    console.log('\nSearch Results:');
    console.log(JSON.stringify(students, null, 2));

  } catch (err) {
    console.error('Error during search test:', err);
  }
}

run();
