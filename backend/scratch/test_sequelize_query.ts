import { sequelize } from '../src/database/connection';
import { Homework } from '../src/models/Homework';
import StudentModel from '../src/models/Student';
import ClassroomModel from '../src/models/Classroom';
import { Op } from 'sequelize';

async function testQuery() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');

    // Simulate guardian John Doe (user_id = 5)
    const userId = 5;
    let whereClause: any = { isActive: true };

    const students = await StudentModel.findAll({
      where: { guardianId: userId }
    });
    console.log('Students found for guardian 5:', JSON.stringify(students, null, 2));

    if (students.length > 0) {
      const studentClassIds = students.map((s: any) => s.classId);
      console.log('Student class IDs:', studentClassIds);

      const classrooms = await ClassroomModel.findAll({
        where: { classId: studentClassIds }
      });
      console.log('Classrooms found:', JSON.stringify(classrooms, null, 2));

      const classLevels = classrooms.map((c: any) => c.classLevel);
      console.log('Class levels:', classLevels);

      if (classLevels.length > 0) {
        whereClause[Op.or] = classLevels.map((level: string) => ({
          className: {
            [Op.iLike]: level
          }
        }));
      } else {
        whereClause.className = 'NON_EXISTENT_CLASS';
      }
    } else {
      whereClause.className = 'NON_EXISTENT_CLASS';
    }

    console.log('Sequelize query whereClause:', whereClause);

    // Run query and capture console logging of SQL
    const homework = await Homework.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    console.log('Homework returned (expecting both Grade 1-A and grade1-a):');
    console.log(JSON.stringify(homework.map(h => ({ id: h.homeworkId, title: h.title, className: h.className })), null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testQuery();
