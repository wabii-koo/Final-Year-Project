const { ReportCardModel } = require('../dist/models/ReportCard');
const { connectDatabase } = require('../dist/database/connection');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  await connectDatabase();
  console.log('Connected to DB');

  // Find a report card with status unlocked or pending
  const rc = await ReportCardModel.findOne();
  if (!rc) {
    console.log('No report card found');
    return;
  }

  console.log('Found report card ID:', rc.reportcardId, 'status:', rc.status);

  try {
    console.log('Attempting update with filledAt...');
    await rc.update({
      status: 'pending',
      filledAt: new Date()
    });
    console.log('✅ Update successful!');
  } catch (err) {
    console.error('❌ Update failed:', err);
  }
}

main().catch(console.error);
