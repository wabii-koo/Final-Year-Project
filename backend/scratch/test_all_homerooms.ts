import { sequelize } from '../src/database/connection';
import { Homework } from '../src/models/Homework';
import ClassroomModel from '../src/models/Classroom';
import { HomeworkView } from '../src/models/HomeworkView';
import { HomeworkFeedback } from '../src/models/HomeworkFeedback';
import { UserModel } from '../src/models/User';
import { Op } from 'sequelize';

async function testAll() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');

    // Fetch all homeroom teachers
    const [teachers] = await sequelize.query("SELECT user_id, email, full_name FROM users WHERE role = 'homeroom_teacher'");
    console.log('Homeroom teachers in DB:', teachers.map((t: any) => `${t.full_name} (${t.email}, ID: ${t.user_id})`));

    // Fetch all classrooms
    const [classrooms] = await sequelize.query('SELECT class_id, class_level FROM "Classrooms"');
    console.log('Classrooms in DB:', classrooms);

    for (const t of teachers as any[]) {
      const userId = t.user_id;
      for (const c of classrooms as any[]) {
        const classId = c.class_id;
        console.log(`\n--- Testing Teacher: ${t.full_name} (ID: ${userId}) with Class: ${c.class_level} (ID: ${classId}) ---`);

        let whereClause: any = { isActive: true };

        const homeroomClassrooms = await ClassroomModel.findAll({
          where: { homeroomTeacherId: userId }
        });
        
        const classLevels: string[] = homeroomClassrooms.map((cc: any) => cc.classLevel);
        
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

        try {
          const homework = await Homework.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
          });

          // Run mapping
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
              teacherName
            };
          }));

          console.log(`Success! Found and transformed ${transformedHomework.length} homework items.`);
        } catch (err: any) {
          console.error(`❌ FAILED for Teacher ID ${userId} and Class ID ${classId}:`, err.message);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

testAll();
