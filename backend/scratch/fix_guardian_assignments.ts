import { sequelize } from '../src/database/connection';
import { StudentModel } from '../src/models/Student';
import { GuardianRegistrationModel } from '../src/models/GuardianRegistration';
import { UserModel } from '../src/models/User';
import { Op } from 'sequelize';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // 1. Fetch all students
    const students = await StudentModel.findAll();
    console.log(`Found ${students.length} students in DB.`);

    // 2. Fetch all approved registrations
    const registrations = await GuardianRegistrationModel.findAll({
      where: { status: 'approved' }
    });
    console.log(`Found ${registrations.length} approved registrations in DB.`);

    // 3. Fetch all guardian users
    const guardians = await UserModel.findAll({
      where: { role: 'guardian' }
    });
    console.log(`Found ${guardians.length} guardian users in DB.`);

    let linkedCount = 0;

    for (const registration of registrations) {
      console.log(`\nProcessing approved registration ID ${registration.registrationId}:`);
      console.log(`  Guardian Name: "${registration.fullName}" (${registration.email})`);
      console.log(`  Target Student Name: "${registration.studentName}"`);

      // Find the guardian user matching email
      const guardianUser = guardians.find(g => g.email.toLowerCase() === registration.email.toLowerCase());
      if (!guardianUser) {
        console.log(`  ⚠️ Guardian user with email ${registration.email} not found in Users table!`);
        continue;
      }

      // Find the student in Students table matching name (case-insensitive)
      const student = students.find(s => s.fullName.trim().toLowerCase() === registration.studentName.trim().toLowerCase());
      if (!student) {
        console.log(`  ⚠️ Student "${registration.studentName}" not found in Students table!`);
        continue;
      }

      console.log(`  Found matching student: "${student.fullName}" (ID: ${student.studentId})`);
      console.log(`  Found matching guardian user: "${guardianUser.fullName}" (ID: ${guardianUser.userId})`);

      // Update student's guardianId
      if (student.guardianId !== guardianUser.userId) {
        await student.update({ guardianId: guardianUser.userId });
        console.log(`  ✅ Linked Student ID ${student.studentId} to Guardian User ID ${guardianUser.userId}`);
      } else {
        console.log(`  Already linked correctly.`);
      }

      // Update registration's studentId
      if (registration.studentId !== student.studentId) {
        await registration.update({ studentId: student.studentId });
        console.log(`  ✅ Updated registration studentId to ${student.studentId}`);
      }

      linkedCount++;
    }

    console.log(`\nSuccess: Linked ${linkedCount} students to guardians.`);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during execution:', err);
    process.exit(1);
  }
}

run();
