import { sequelize } from '../src/database/connection';
import { Op } from 'sequelize';
import StudentModel from '../src/models/Student';
import UserModel from '../src/models/User';
import ClassroomModel from '../src/models/Classroom';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');

    // Initialize associations (usually connection.ts does this, but we do it manually to be sure)
    const { initStudentAssociations } = require('../src/models/Student');
    initStudentAssociations();

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
          attributes: ['fullName', 'email', 'phoneNo', 'nationalId', 'address']
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

    process.exit(0);
  } catch (err) {
    console.error('Error during search test:', err);
    process.exit(1);
  }
}

run();
