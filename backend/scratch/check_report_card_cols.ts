import { sequelize } from '../src/database/connection';

async function checkReportCardColumns() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');
    const [res] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ReportCards'");
    console.log('ReportCards Columns:', JSON.stringify(res, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkReportCardColumns();
