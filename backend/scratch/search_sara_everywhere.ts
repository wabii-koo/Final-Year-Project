import { sequelize } from '../src/database/connection';

async function main() {
  await sequelize.authenticate();
  console.log('Connected to DB');

  // List of tables and columns to check
  const checks = [
    { table: 'Classrooms', cols: ['class_level'] },
    { table: 'classrooms', cols: ['class_level'] },
    { table: 'Students', cols: ['full_name'] },
    { table: 'students', cols: ['full_name'] },
    { table: 'Homework', cols: ['title', 'description', 'subject'] },
    { table: 'homework', cols: ['title', 'description', 'subject'] },
    { table: 'messages', cols: ['content'] },
    { table: 'Messages', cols: ['content'] },
    { table: 'notifications', cols: ['title', 'content'] },
    { table: 'Notifications', cols: ['title', 'content'] },
    { table: 'ReportCards', cols: ['teacher_comments', 'principal_comments'] },
    { table: 'reportcards', cols: ['teacher_comments', 'principal_comments'] }
  ];

  for (const check of checks) {
    try {
      // Build search query for each column
      const whereClause = check.cols.map(col => `"${col}" ILIKE '%sara%'`).join(' OR ');
      const [res] = await sequelize.query(`SELECT * FROM "${check.table}" WHERE ${whereClause}`) as any;
      if (res.length > 0) {
        console.log(`\nFound matches in table "${check.table}":`);
        console.log(JSON.stringify(res, null, 2));
      }
    } catch (e: any) {
      // Table or column might not exist in this database dialect/schema, skip it
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
