import { sequelize } from '../src/database/connection';

async function checkColumns() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');
    const [res] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Homework'");
    console.log('Homework Columns:', JSON.stringify(res, null, 2));

    const [views] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'HomeworkViews'");
    console.log('HomeworkViews Columns:', JSON.stringify(views, null, 2));

    const [feedback] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'HomeworkFeedback'");
    console.log('HomeworkFeedback Columns:', JSON.stringify(feedback, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkColumns();
