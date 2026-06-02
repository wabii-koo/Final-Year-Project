import { sequelize } from '../src/database/connection';
import { GuardianRegistrationModel } from '../src/models/GuardianRegistration';
import { StudentModel } from '../src/models/Student';
import { UserModel } from '../src/models/User';
import { Op } from 'sequelize';

async function main() {
  await sequelize.authenticate();
  console.log('DB Connection successful');

  // Find all approved registrations
  const approvedRegistrations = await GuardianRegistrationModel.findAll({
    where: { status: 'approved' }
  });

  console.log(`\n--- Approved Registrations: ${approvedRegistrations.length} ---`);
  
  // Find all registrations (approved or locked/rejected) by studentName or studentId
  // to see if multiple guardians exist for the same student.
  const allRegistrations = await GuardianRegistrationModel.findAll();
  
  // Map student name to registrations
  const studentMap: { [key: string]: typeof allRegistrations } = {};
  for (const reg of allRegistrations) {
    const key = reg.studentName.trim().toLowerCase();
    if (!studentMap[key]) {
      studentMap[key] = [];
    }
    studentMap[key].push(reg);
  }

  console.log('\n--- Registrations Grouped by Student Name ---');
  for (const [studentName, regs] of Object.entries(studentMap)) {
    if (regs.length > 1) {
      console.log(`Student: "${studentName}" has ${regs.length} registrations:`);
      for (const reg of regs) {
        console.log(`  - Reg ID: ${reg.registrationId}, Guardian: "${reg.fullName}" (${reg.email}), Status: "${reg.status}"`);
      }
    }
  }

  // Find users in Users table who are guardians
  const guardianUsers = await UserModel.findAll({
    where: { role: 'guardian' }
  });

  console.log(`\n--- Guardian Users in DB: ${guardianUsers.length} ---`);
  for (const user of guardianUsers) {
    // See if they are linked to any student
    const linkedStudents = await StudentModel.findAll({
      where: { guardianId: user.userId }
    });
    const reg = allRegistrations.find(r => r.email.toLowerCase() === user.email.toLowerCase());
    console.log(`Guardian User ID ${user.userId}: "${user.fullName}" (${user.email})`);
    if (linkedStudents.length > 0) {
      console.log(`  -> Linked to Student(s): ${linkedStudents.map(s => `"${s.fullName}" (ID: ${s.studentId})`).join(', ')}`);
    } else {
      console.log(`  -> ⚠️ ORPHAN (not linked to any student in Students table). Registration student_name: "${reg?.studentName || 'Unknown'}" (Reg Status: ${reg?.status || 'None'})`);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
