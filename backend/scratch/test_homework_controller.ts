import { Sequelize, Op } from 'sequelize';
import { HomeworkModel } from '../src/models/Homework';
import { ClassroomModel } from '../src/models/Classroom';
import { StudentModel } from '../src/models/Student';
import { UserModel } from '../src/models/User';
import { HomeworkView } from '../src/models/HomeworkView';
import { HomeworkFeedback } from '../src/models/HomeworkFeedback';

const sequelize = new Sequelize(process.env.DB_URL || '', {
  dialect: 'postgres',
  logging: true,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function test() {
  try {
    const userId = 3;
    const userRole = 'homeroom_teacher';
    const classId = '1';

    console.log('Simulating getHomework for userId 3 in ts...');

    let whereClause: any = { isActive: true };

    const homeroomClassrooms = await ClassroomModel.findAll({
      where: { homeroomTeacherId: userId }
    });
    
    const classLevels = homeroomClassrooms.map((c: any) => c.classLevel);
    console.log('Homeroom class levels:', classLevels);
    
    if (classId) {
      const targetClass = await ClassroomModel.findByPk(classId);
      if (targetClass && !classLevels.includes(targetClass.classLevel)) {
        classLevels.push(targetClass.classLevel);
      }
    }
    
    if (classLevels.length > 0) {
      whereClause = {
        isActive: true,
        [Op.or]: [
          { teacherId: userId },
          { className: classLevels }
        ]
      };
    } else {
      whereClause.teacherId = userId;
    }

    console.log('Where clause:', whereClause);

    const homework = await HomeworkModel.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${homework.length} homework items.`);

    const transformedHomework = await Promise.all(homework.map(async (h: any) => {
      const teacher = await UserModel.findByPk(h.teacherId);
      const teacherName = teacher ? teacher.fullName : 'Unknown Teacher';

      const viewCount = await HomeworkView.count({
        where: { homeworkId: h.homeworkId }
      });

      const feedbackCount = await HomeworkFeedback.count({
        where: { homeworkId: h.homeworkId }
      });

      const userHasSeen = await HomeworkView.findOne({
        where: { homeworkId: h.homeworkId, guardianId: userId }
      });

      return {
        homeworkId: h.homeworkId,
        title: h.title,
        description: h.description,
        subject: h.subject,
        className: h.className,
        dueDate: h.dueDate,
        createdAt: h.createdAt,
        isActive: h.isActive,
        teacherName,
        viewCount,
        feedbackCount,
        isSeen: !!userHasSeen
      };
    }));

    console.log('Transformed homework sample count:', transformedHomework.length);
    console.log('TEST PASSED SUCCESSFULLY!');

  } catch(e) {
    console.error('TEST FAILED WITH ERROR:', e);
  }
  process.exit();
}

test();
