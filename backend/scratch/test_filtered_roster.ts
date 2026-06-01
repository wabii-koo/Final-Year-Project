import { sequelize } from '../src/database/connection';
import { TeacherController } from '../src/controllers/teacherController';

async function main() {
  const req = {
    user: {
      userId: 3, // homeroom teacher Ms. Sarah Smith
      role: 'homeroom_teacher'
    },
    params: {},
    query: {}
  };
  const res = {
    json: (data: any) => {
      console.log('API returned students count:', data.length);
      console.log('Students:', JSON.stringify(data, null, 2));
    },
    status: (code: number) => {
      console.log('Status code:', code);
      return res;
    }
  };

  const controller = new TeacherController();
  await controller.getTeacherStudents(req as any, res as any);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
