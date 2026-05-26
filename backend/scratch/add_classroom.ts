import { sequelize } from '../src/database/connection';
import { ClassroomModel } from '../src/models/Classroom';

async function addClassroom() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');

    // Check if Grade 3-B exists
    const existing = await ClassroomModel.findOne({
      where: { classLevel: 'Grade 3-B' } as any
    });

    if (existing) {
      console.log('Classroom Grade 3-B already exists.');
      process.exit(0);
    }

    // Create Grade 3-B classroom (linking to existing teacher Ms. Smith ID = 3)
    await ClassroomModel.create({
      teacherId: 3,
      classLevel: 'Grade 3-B',
      homeroomTeacherId: 3,
      academicYear: '2025/2026'
    } as any);

    console.log('Successfully created classroom "Grade 3-B" in database.');
    process.exit(0);
  } catch (err: any) {
    console.error('Failed to create classroom:', err);
    process.exit(1);
  }
}

addClassroom();
