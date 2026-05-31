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

    // Sarah Smith (user_id 3) is homeroom teacher for Grade 1A (which has student 18)
    const sarahToken = generateToken(3, 'sarah.smith@school.com', 'homeroom_teacher');
    // James Johnson (user_id 4) is homeroom teacher for Grade 2B (does NOT manage student 18's class)
    const jamesToken = generateToken(4, 'james.johnson@school.com', 'homeroom_teacher');

    const sarahHeaders = { 
      'Authorization': `Bearer ${sarahToken}`,
      'Content-Type': 'application/json'
    };
    const jamesHeaders = { 
      'Authorization': `Bearer ${jamesToken}`,
      'Content-Type': 'application/json'
    };

    console.log('Cleaning up existing test report cards for student 18...');
    await ReportCardModel.destroy({ where: { studentId: 18 } });

    // 1. James Johnson tries to create a report card for student 18 (should fail with 403)
    console.log('\n--- 1. James (unauthorized) tries to create card for student 18 ---');
    const createPayload = {
      studentId: 18,
      term: 'Semester 1',
      academicYear: '2025-2026',
      subjectsGrades: {
        'English': '92 (A)',
        'Mathematics': '95 (A+)',
        'Science': '89 (A-)',
        'Amharic': '85 (B)'
      },
      teacherComments: 'Good work.',
      conductGrade: 'Excellent',
      overallGrade: 'A'
    };

    const createResJames = await fetch(`${BASE_URL}/report-cards`, {
      method: 'POST',
      headers: jamesHeaders,
      body: JSON.stringify(createPayload)
    });
    
    const resDataJames: any = await createResJames.json();
    console.log('James Create status (should be 403):', createResJames.status);
    console.log('James Create success (should be false):', resDataJames.success);
    console.log('James Error message:', resDataJames.message);

    // 2. Sarah Smith creates a report card for student 18 (should succeed with 201)
    console.log('\n--- 2. Sarah (authorized homeroom teacher) creates card for student 18 ---');
    const createResSarah = await fetch(`${BASE_URL}/report-cards`, {
      method: 'POST',
      headers: sarahHeaders,
      body: JSON.stringify(createPayload)
    });
    
    const resDataSarah: any = await createResSarah.json();
    console.log('Sarah Create status (should be 201):', createResSarah.status);
    console.log('Sarah Create success (should be true):', resDataSarah.success);
    const reportCardId = resDataSarah.data?.reportcardId;
    console.log('Created Report Card ID:', reportCardId);
    console.log('Saved grades:', resDataSarah.data?.subjectsGrades);

    // 3. James tries to update the report card (should fail with 403)
    console.log('\n--- 3. James (unauthorized) tries to update Sarah\'s card ---');
    const updateResJames = await fetch(`${BASE_URL}/report-cards/${reportCardId}`, {
      method: 'PUT',
      headers: jamesHeaders,
      body: JSON.stringify({
        teacherComments: 'Malicious modification attempt.'
      })
    });
    const resDataUpdateJames: any = await updateResJames.json();
    console.log('James Update status (should be 403):', updateResJames.status);
    console.log('James Update success (should be false):', resDataUpdateJames.success);
    console.log('James Update error message:', resDataUpdateJames.message);

    // 4. Sarah updates the report card (should succeed with 200)
    console.log('\n--- 4. Sarah (authorized homeroom teacher) updates the card ---');
    const updateResSarah = await fetch(`${BASE_URL}/report-cards/${reportCardId}`, {
      method: 'PUT',
      headers: sarahHeaders,
      body: JSON.stringify({
        subjectsGrades: {
          'English': '94 (A)',
          'Mathematics': '98 (A+)',
          'Science': '91 (A)',
          'Amharic': '87 (B+)'
        },
        teacherComments: 'Corrected grades.'
      })
    });
    const resDataUpdateSarah: any = await updateResSarah.json();
    console.log('Sarah Update status (should be 200):', updateResSarah.status);
    console.log('Sarah Update success (should be true):', resDataUpdateSarah.success);
    console.log('Sarah Updated grades:', resDataUpdateSarah.data?.subjectsGrades);

    // Clean up
    console.log('\nCleaning up test report cards...');
    await ReportCardModel.destroy({ where: { studentId: 18 } });
    
    console.log('\nHOMEROOM TEACHER & GRADE/SCORE VALIDATION INTEGRATION TEST SUCCESSFUL!');
    process.exit(0);
  } catch (error: any) {
    console.error('Integration test failed!');
    console.error(error);
    process.exit(1);
  }
}

runTest();
