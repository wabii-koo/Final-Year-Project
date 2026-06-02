import { sequelize, connectDatabase } from './src/database/connection';
import { EventModel } from './src/models/Event';

async function main() {
  try {
    await connectDatabase();
    const events = await EventModel.findAll({
      where: {
        title: 'hhdhdjljgdfklvlk'
      }
    });

    console.log(`Found ${events.length} event(s) matching title "hhdhdjljgdfklvlk":`);
    events.forEach(e => console.log(e.toJSON()));
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

main();
