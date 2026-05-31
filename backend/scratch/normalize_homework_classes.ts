import { sequelize } from '../src/database/connection';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');
    
    // Fetch all classrooms to get correct class levels
    const [classrooms] = await sequelize.query('SELECT class_level FROM "Classrooms"');
    const correctLevels = classrooms.map((c: any) => c.class_level);
    console.log('Correct classroom levels in DB:', correctLevels);

    // Fetch all homework
    const [homeworks] = await sequelize.query('SELECT homework_id, class_name FROM "Homework"');
    
    for (const hw of homeworks as any[]) {
      // Find matching correct level (case-insensitive and ignoring spaces/dashes)
      const matched = correctLevels.find((level: string) => {
        const normLevel = level.replace(/[\s_-]+/g, '').toLowerCase();
        const normHWClass = hw.class_name.replace(/[\s_-]+/g, '').toLowerCase();
        return normLevel === normHWClass;
      });

      if (matched && matched !== hw.class_name) {
        console.log(`Updating homework ID ${hw.homework_id}: "${hw.class_name}" -> "${matched}"`);
        await sequelize.query('UPDATE "Homework" SET class_name = ? WHERE homework_id = ?', {
          replacements: [matched, hw.homework_id]
        });
      }
    }
    
    console.log('Casing normalization complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
