import { Request, Response } from 'express';
import { sequelize } from '../src/database/connection';
import { validateRegistration } from '../src/controllers/guardianRegistrationController';

// Mock Express response object builder
function mockResponse() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };
  return res;
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database.');

    // 1. Test case: Non-existent student name
    console.log('\n--- Test Case 1: Non-existent Student ---');
    const req1 = {
      body: {
        fullName: 'Test Guardian',
        email: 'test_guardian_new@abc.com',
        phoneNo: '+251999999999',
        password: 'password123',
        nationalId: 'nat_id_999',
        studentName: 'Nonexistent Student Name',
        relationshipType: 'legal_guardian'
      }
    } as Request;

    const res1 = mockResponse();
    await validateRegistration(req1, res1);
    console.log('Response Status:', res1.statusCode);
    console.log('Response JSON:', JSON.stringify(res1.jsonData, null, 2));

    // 2. Test case: Valid student name (e.g. Ruth Kiros)
    console.log('\n--- Test Case 2: Existing Student ---');
    const req2 = {
      body: {
        fullName: 'Test Guardian',
        email: 'test_guardian_new@abc.com',
        phoneNo: '+251999999999',
        password: 'password123',
        nationalId: 'nat_id_999',
        studentName: 'Ruth Kiros',
        relationshipType: 'legal_guardian'
      }
    } as Request;

    const res2 = mockResponse();
    await validateRegistration(req2, res2);
    console.log('Response Status:', res2.statusCode);
    console.log('Response JSON (Success check):', {
      success: res2.jsonData?.success,
      message: res2.jsonData?.message,
      code: res2.jsonData?.error?.code
    });

    process.exit(0);
  } catch (err) {
    console.error('Error during validation test:', err);
    process.exit(1);
  }
}

run();
