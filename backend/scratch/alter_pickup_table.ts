import { sequelize } from '../src/database/connection';

async function alterPickupTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    console.log('Altering PickupRequests table to add pickup_time_start...');
    await sequelize.query('ALTER TABLE "PickupRequests" ADD COLUMN IF NOT EXISTS pickup_time_start VARCHAR(20)');
    console.log('Altering PickupRequests table to add pickup_time_end...');
    await sequelize.query('ALTER TABLE "PickupRequests" ADD COLUMN IF NOT EXISTS pickup_time_end VARCHAR(20)');

    console.log('✅ Columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to alter table:', error);
    process.exit(1);
  }
}

alterPickupTable();
