import { Request, Response } from 'express';
import 'multer';
import { sequelize } from '../src/database/connection';
import { validateRegistration, updateRegistration } from '../src/controllers/guardianRegistrationController';
import { GuardianRegistrationModel } from '../src/models/GuardianRegistration';
import { StudentModel } from '../src/models/Student';

// Mock Response helper
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

// Simple mock for jest functions outside of jest runner
const jest = {
  fn: (impl?: any) => {
    const fn = (...args: any[]) => {
      fn.mock.calls.push(args);
      if (impl) return impl(...args);
    };
    fn.mock = { calls: [] as any[] };
    fn.mockReturnValue = (val: any) => {
      impl = () => val;
      return fn;
    };
    return fn;
  }
};

async function test() {
  await sequelize.authenticate();
  console.log('Connected to DB');

  // We are going to test validateRegistration
  console.log('\n--- Test Case 1: Registering a student already linked to a guardian (Abebe Kebede) ---');
  
  const req1 = {
    body: {
      fullName: 'New Guardian Name',
      email: 'newguardian@test.com',
      phoneNo: '0912345678',
      password: 'Password123!',
      nationalId: '123456789012',
      studentName: 'Abebe Kebede', // Already linked to User ID 34
      relationshipType: 'parent'
    }
  } as Request;

  const res1 = mockResponse();

  await validateRegistration(req1, res1);

  console.log('Status Called with:', (res1.status as any).mock.calls);
  console.log('JSON Called with:', (res1.json as any).mock.calls);

  // Assertions
  const status1 = (res1.status as any).mock.calls[0]?.[0];
  const json1 = (res1.json as any).mock.calls[0]?.[0];
  if (status1 === 400 && json1?.error?.code === 'STUDENT_ALREADY_LINKED') {
    console.log('✅ Test Case 1 Passed! Correctly rejected student registration with STUDENT_ALREADY_LINKED.');
  } else {
    console.error('❌ Test Case 1 Failed!');
  }

  console.log('\n--- Test Case 2: Registering a student who has an active pending registration ---');

  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const tempEmail = `pending_${Date.now()}@test.com`;
  const tempPhone = `09${randomSuffix}11`;
  const tempNationalId = `99${randomSuffix}9911`;

  // Let's create a temporary pending registration for "Alem Tsegaye" (ID 112, currently guardianId is null)
  // We'll create it directly in GuardianRegistrationModel with status: 'pending'
  const tempReg = await GuardianRegistrationModel.create({
    fullName: 'Pending Guardian',
    email: tempEmail,
    phoneNo: tempPhone,
    passwordHash: 'somehash',
    nationalId: tempNationalId,
    studentId: 112,
    studentName: 'Alem Tsegaye',
    relationshipType: 'parent',
    certificateDocumentPath: 'path/to/cert',
    idFrontPath: 'path/to/front',
    idBackPath: 'path/to/back',
    status: 'pending',
    correctionAttempts: 2
  });

  const req2 = {
    body: {
      fullName: 'Another Guardian',
      email: `another_${Date.now()}@test.com`,
      phoneNo: `09${randomSuffix}22`,
      password: 'Password123!',
      nationalId: `99${randomSuffix}9922`,
      studentName: 'Alem Tsegaye',
      relationshipType: 'parent'
    }
  } as Request;

  const res2 = mockResponse();

  await validateRegistration(req2, res2);

  console.log('Status Called with:', (res2.status as any).mock.calls);
  console.log('JSON Called with:', (res2.json as any).mock.calls);

  // Assertions
  const status2 = (res2.status as any).mock.calls[0]?.[0];
  const json2 = (res2.json as any).mock.calls[0]?.[0];
  if (status2 === 400 && json2?.error?.code === 'STUDENT_ALREADY_REGISTERED') {
    console.log('✅ Test Case 2 Passed! Correctly rejected student registration with STUDENT_ALREADY_REGISTERED.');
  } else {
    console.error('❌ Test Case 2 Failed!');
  }

  // Clean up temporary registration
  await tempReg.destroy();
  console.log('Cleaned up temporary pending registration.');
  
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
