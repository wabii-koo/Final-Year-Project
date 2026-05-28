import { sequelize } from '../src/database/connection';

async function checkPickupColumns() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database');
    const [res] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'PickupRequests'");
    console.log('PickupRequests Columns:', JSON.stringify(res, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkPickupColumns();
