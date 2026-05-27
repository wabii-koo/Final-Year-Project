import { sequelize } from '../src/database/connection';
import { Homework } from '../src/models/Homework';
import ClassroomModel from '../src/models/Classroom';
import { HomeworkView } from '../src/models/HomeworkView';
import { HomeworkFeedback } from '../src/models/HomeworkFeedback';
import { UserModel } from '../src/models/User';
import { Op } from 'sequelize';

async function testHomeroomFull() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');

    const userId = 3;
    const classId = 1;
    let whereClause: any = { isActive: true };

    const homeroomClassrooms = await ClassroomModel.findAll({
      where: { homeroomTeacherId: userId }
    });
    
    const classLevels: string[] = homeroomClassrooms.map((c: any) => c.classLevel);
    
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

    const homework = await Homework.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    console.log('Homework found:', homework.length);

    // Run the mapping code
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

    console.log('Transformed Homework count:', transformedHomework.length);
    process.exit(0);
  } catch (err) {
    console.error('Error during full query:', err);
    process.exit(1);
  }
}

testHomeroomFull();
