import { sequelize } from '../src/database/connection';

async function main() {
  await sequelize.authenticate();
  console.log('Connected to DB');

  const [res] = await sequelize.query(`
    SELECT request_id, student_id, student_name, guardian_name, authorized_person_name
    FROM "PickupRequests"
    WHERE student_id = 11
  `) as any;

  console.log('Pickup Requests for student ID 11:');
  console.log(res);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
