import { sequelize } from '../src/database/connection';
import { ReportCardModel } from '../src/models/ReportCard';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-12345';
const PORT = process.env.PORT || '3000';
const BASE_URL = `http://localhost:${PORT}/api`;

function generateToken(userId: number, email: string, role: string) {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '1h' });
}

async function runTest() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const teacherToken = generateToken(3, 'sarah.smith@school.com', 'homeroom_teacher');
    const directorToken = generateToken(1, 'director@school.com', 'director');

    const teacherHeaders = { 
      'Authorization': `Bearer ${teacherToken}`,
      'Content-Type': 'application/json'
    };
    const directorHeaders = { 
      'Authorization': `Bearer ${directorToken}`,
      'Content-Type': 'application/json'
    };

    console.log('Cleaning up existing test report cards for student 18...');
    await ReportCardModel.destroy({ where: { studentId: 18 } });

    // 1. Teacher creates a report card (status: pending)
    console.log('\n--- 1. Creating report card as Homeroom Teacher ---');
    const createPayload = {
      studentId: 18,
      term: 'Semester 1',
      academicYear: '2025-2026',
      subjectsGrades: {
        'Mathematics': 'A',
        'English': 'B+'
      },
      teacherComments: 'Good work.',
      conductGrade: 'Very Good',
      overallGrade: 'B+'
    };

    const createRes = await fetch(`${BASE_URL}/report-cards`, {
      method: 'POST',
      headers: teacherHeaders,
      body: JSON.stringify(createPayload)
    });
    
    const createResData: any = await createRes.json();
    console.log('Create response status (should be 201):', createRes.status);
    const reportCardId = createResData.data.reportcardId;
    console.log('Created Report Card ID:', reportCardId);
    console.log('Initial Status:', createResData.data.status); // pending

    // 2. Teacher updates the pending report card
    console.log('\n--- 2. Updating pending report card as Teacher ---');
    const updatePayload = {
      subjectsGrades: {
        'Mathematics': 'A+',
        'English': 'A'
      },
      teacherComments: 'Exceptional improvement!',
      conductGrade: 'Excellent',
      overallGrade: 'A'
    };

    const updateRes = await fetch(`${BASE_URL}/report-cards/${reportCardId}`, {
      method: 'PUT',
      headers: teacherHeaders,
      body: JSON.stringify(updatePayload)
    });
    
    const updateResData: any = await updateRes.json();
    console.log('Update response status (should be 200):', updateRes.status);
    console.log('Updated Grades:', updateResData.data.subjectsGrades);
    console.log('Updated Comments:', updateResData.data.teacherComments);
    console.log('Updated Status (should remain pending):', updateResData.data.status);

    // 3. Director approves the report card
    console.log('\n--- 3. Approving report card as Director ---');
    const approveRes = await fetch(`${BASE_URL}/report-cards/${reportCardId}/approve`, {
      method: 'PUT',
      headers: directorHeaders
    });
    console.log('Approve status (should be 200):', approveRes.status);

    // 4. Teacher tries to update approved report card (should fail with 400)
    console.log('\n--- 4. Attempting to update approved report card (should be blocked) ---');
    const updateRes2 = await fetch(`${BASE_URL}/report-cards/${reportCardId}`, {
      method: 'PUT',
      headers: teacherHeaders,
      body: JSON.stringify({
        teacherComments: 'Attempting edit after approval.'
      })
    });
    const updateResData2: any = await updateRes2.json();
    console.log('Update status code (should be 400):', updateRes2.status);
    console.log('Update success (should be false):', updateResData2.success);
    console.log('Error message:', updateResData2.message);

    // 5. Director unlocks the report card (rejected/sent for revision)
    console.log('\n--- 5. Unlocking report card as Director ---');
    const unlockRes = await fetch(`${BASE_URL}/report-cards/${reportCardId}/unlock`, {
      method: 'PUT',
      headers: directorHeaders
    });
    const unlockResData: any = await unlockRes.json();
    console.log('Unlock status (should be 200):', unlockRes.status);
    console.log('Unlocked Card Status (should be unlocked):', unlockResData.data.status);

    // 6. Teacher updates the unlocked report card (should succeed and reset status to pending)
    console.log('\n--- 6. Updating unlocked report card as Teacher ---');
    const updateRes3 = await fetch(`${BASE_URL}/report-cards/${reportCardId}`, {
      method: 'PUT',
      headers: teacherHeaders,
      body: JSON.stringify({
        teacherComments: 'Corrected after revision request.',
        overallGrade: 'A-'
      })
    });
    const updateResData3: any = await updateRes3.json();
    console.log('Update status code (should be 200):', updateRes3.status);
    console.log('New Status (should reset to pending):', updateResData3.data.status);
    console.log('New Comments:', updateResData3.data.teacherComments);

    // Clean up
    console.log('\nCleaning up test report cards...');
    await ReportCardModel.destroy({ where: { studentId: 18 } });
    
    console.log('\nREPORT CARD UPDATE INTEGRATION TEST SUCCESSFUL!');
    process.exit(0);
  } catch (error: any) {
    console.error('Integration test failed!');
    console.error(error);
    process.exit(1);
  }
}

runTest();
