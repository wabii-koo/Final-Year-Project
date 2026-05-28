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

    // 1. Generate Tokens
    const guardianToken = generateToken(5, 'guardian@example.com', 'guardian');
    const teacherToken = generateToken(3, 'sarah.smith@school.com', 'homeroom_teacher');
    const directorToken = generateToken(1, 'director@school.com', 'director');

    const guardianHeaders = { 
      'Authorization': `Bearer ${guardianToken}`,
      'Content-Type': 'application/json'
    };
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

    // 2. Teacher creates a report card
    console.log('\n--- 1. Creating report card as Homeroom Teacher ---');
    const createPayload = {
      studentId: 18,
      term: 'Semester 1',
      academicYear: '2025-2026',
      subjectsGrades: {
        'Mathematics': 'A',
        'English': 'B+',
        'Science': 'A-'
      },
      teacherComments: 'Great progress this term!',
      conductGrade: 'Excellent',
      overallGrade: 'A'
    };

    const createRes = await fetch(`${BASE_URL}/report-cards`, {
      method: 'POST',
      headers: teacherHeaders,
      body: JSON.stringify(createPayload)
    });
    
    const createResData: any = await createRes.json();
    console.log('Create response status (should be 201):', createRes.status);
    console.log('Create response success:', createResData.success);
    
    if (!createResData.success) {
      console.error('Failed to create:', createResData);
      process.exit(1);
    }
    
    const reportCardId = createResData.data.reportcardId;
    console.log('Created Report Card ID:', reportCardId);
    console.log('Initial Status:', createResData.data.status); // should be pending

    // 3. Teacher fetches report cards (should see it)
    console.log('\n--- 2. Fetching report cards as Teacher ---');
    const getResTeacher = await fetch(`${BASE_URL}/report-cards`, { headers: teacherHeaders });
    const getResTeacherData: any = await getResTeacher.json();
    const foundByTeacher = getResTeacherData.data.reportCards.find((rc: any) => rc.id === reportCardId);
    console.log('Teacher get success:', getResTeacherData.success);
    console.log('Found by teacher (should be true):', !!foundByTeacher);
    console.log('Report card status in teacher feed:', foundByTeacher?.status);

    // 4. Guardian fetches report cards (should NOT see it, because it is pending)
    console.log('\n--- 3. Fetching report cards as Guardian (before approval) ---');
    const getResGuardianBefore = await fetch(`${BASE_URL}/report-cards`, { headers: guardianHeaders });
    const getResGuardianBeforeData: any = await getResGuardianBefore.json();
    const foundByGuardianBefore = getResGuardianBeforeData.data.reportCards.find((rc: any) => rc.id === reportCardId);
    console.log('Guardian get success:', getResGuardianBeforeData.success);
    console.log('Found by guardian before approval (should be false):', !!foundByGuardianBefore);

    // 5. Director approves the report card
    console.log('\n--- 4. Approving report card as Director ---');
    const approveRes = await fetch(`${BASE_URL}/report-cards/${reportCardId}/approve`, {
      method: 'PUT',
      headers: directorHeaders
    });
    const approveResData: any = await approveRes.json();
    console.log('Approve response status (should be 200):', approveRes.status);
    console.log('Approve response success:', approveResData.success);
    console.log('Approved Status:', approveResData.data.status);

    // 6. Guardian fetches report cards again (should now see it)
    console.log('\n--- 5. Fetching report cards as Guardian (after approval) ---');
    const getResGuardianAfter = await fetch(`${BASE_URL}/report-cards`, { headers: guardianHeaders });
    const getResGuardianAfterData: any = await getResGuardianAfter.json();
    const foundByGuardianAfter = getResGuardianAfterData.data.reportCards.find((rc: any) => rc.id === reportCardId);
    console.log('Guardian get success:', getResGuardianAfterData.success);
    console.log('Found by guardian after approval (should be true):', !!foundByGuardianAfter);
    console.log('Report card status in guardian feed:', foundByGuardianAfter?.status);

    // Clean up
    console.log('\nCleaning up test report cards...');
    await ReportCardModel.destroy({ where: { studentId: 18 } });
    
    console.log('\nREPORT CARD INTEGRATION TEST SUCCESSFUL!');
    process.exit(0);
  } catch (error: any) {
    console.error('Integration test failed!');
    console.error(error);
    process.exit(1);
  }
}

runTest();
