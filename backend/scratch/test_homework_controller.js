const { Sequelize, Op } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: true, // Enable SQL logging to see what query is generated
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

// Import models manually using sequelize definitions
const { HomeworkModel } = require('../src/models/Homework');
const { ClassroomModel } = require('../src/models/Classroom');
const { StudentModel } = require('../src/models/Student');
const { UserModel } = require('../src/models/User');
const { HomeworkViewModel } = require('../src/models/HomeworkView');
const { HomeworkFeedbackModel } = require('../src/models/HomeworkFeedback');

async function test() {
  try {
    const userId = 3;
    const userRole = 'homeroom_teacher';
    const classId = '1'; // simulate query param classId=1

    console.log('Simulating getHomework for userId 3...');

    let whereClause = { isActive: true };

    const homeroomClassrooms = await ClassroomModel.findAll({
      where: { homeroomTeacherId: userId }
    });
    
    const classLevels = homeroomClassrooms.map((c) => c.classLevel);
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

    const transformedHomework = await Promise.all(homework.map(async (h) => {
      const teacher = await UserModel.findByPk(h.teacherId);
      const teacherName = teacher ? teacher.fullName : 'Unknown Teacher';

      const viewCount = await HomeworkViewModel.count({
        where: { homeworkId: h.homeworkId }
      });

      const feedbackCount = await HomeworkFeedbackModel.count({
        where: { homeworkId: h.homeworkId }
      });

      const userHasSeen = await HomeworkViewModel.findOne({
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

    console.log('Transformed homework sample:', transformedHomework.slice(0, 2));
    console.log('TEST PASSED SUCCESSFULLY!');

  } catch(e) {
    console.error('TEST FAILED WITH ERROR:', e);
  }
  process.exit();
}

test();
