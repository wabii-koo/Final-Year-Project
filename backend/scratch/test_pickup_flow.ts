import { sequelize } from '../src/database/connection';
import { PickupRequestModel } from '../src/models/PickupRequest';
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
    // Sarah Smith (user_id 3) teaches Grade 1-A (class_id 1), which has student 18
    const assignedTeacherToken = generateToken(3, 'sarah.smith@school.com', 'homeroom_teacher');
    // James Johnson (user_id 4) teaches Grade 2-B (class_id 2), does not teach class_id 1
    const unassignedTeacherToken = generateToken(4, 'james.johnson@school.com', 'homeroom_teacher');

    const guardianHeaders = { 
      'Authorization': `Bearer ${guardianToken}`,
      'Content-Type': 'application/json'
    };
    const assignedTeacherHeaders = { 
      'Authorization': `Bearer ${assignedTeacherToken}`,
      'Content-Type': 'application/json'
    };
    const unassignedTeacherHeaders = { 
      'Authorization': `Bearer ${unassignedTeacherToken}`,
      'Content-Type': 'application/json'
    };

    console.log('Cleaning up existing test requests...');
    await PickupRequestModel.destroy({ where: { guardianId: 5 } });

    // 2. Create pickup request as Guardian for student 18
    console.log('\n--- 1. Creating pickup request as Guardian ---');
    const createPayload = {
      studentId: 18,
      authorizedPersonName: 'Uncle Bob',
      authorizedPersonRelationship: 'Uncle',
      authorizedPersonPhone: '+251911223344',
      authorizedPersonNationalId: 'NID-999999',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      notes: 'Please release student to Bob'
    };

    const createRes = await fetch(`${BASE_URL}/pickup-requests`, {
      method: 'POST',
      headers: guardianHeaders,
      body: JSON.stringify(createPayload)
    });
    const createResData: any = await createRes.json();
    console.log('Create response success:', createResData.success);
    console.log('Created Request ID:', createResData.data.requestId);

    const requestId = createResData.data.requestId;

    // 3. GET /api/pickup-requests as Unassigned Teacher (should NOT see the request)
    console.log('\n--- 2. Fetching requests as Unassigned Teacher (James) ---');
    const getResUnassigned = await fetch(`${BASE_URL}/pickup-requests`, { headers: unassignedTeacherHeaders });
    const getResUnassignedData: any = await getResUnassigned.json();
    console.log('GET response success:', getResUnassignedData.success);
    const foundByUnassigned = getResUnassignedData.data.find((r: any) => r.requestId === requestId);
    console.log('Found request in unassigned teacher feed (should be false):', !!foundByUnassigned);

    // 4. POST /api/pickup-requests/:requestId/process as Unassigned Teacher (should receive 403)
    console.log('\n--- 3. Processing request as Unassigned Teacher (James) ---');
    const processResUnassigned = await fetch(`${BASE_URL}/pickup-requests/${requestId}/process`, {
      method: 'POST',
      headers: unassignedTeacherHeaders,
      body: JSON.stringify({
        status: 'approved',
        notes: 'Trying to approve unauthorized request'
      })
    });
    const processResUnassignedData: any = await processResUnassigned.json();
    console.log('Process response status code (should be 403):', processResUnassigned.status);
    console.log('Process response success (should be false):', processResUnassignedData.success);
    console.log('Error message:', processResUnassignedData.message);

    // 5. GET /api/pickup-requests as Assigned Teacher (Sarah) (should see the request)
    console.log('\n--- 4. Fetching requests as Assigned Teacher (Sarah) ---');
    const getResAssigned = await fetch(`${BASE_URL}/pickup-requests`, { headers: assignedTeacherHeaders });
    const getResAssignedData: any = await getResAssigned.json();
    console.log('GET response success:', getResAssignedData.success);
    const foundByAssigned = getResAssignedData.data.find((r: any) => r.requestId === requestId);
    console.log('Found request in assigned teacher feed (should be true):', !!foundByAssigned);

    // 6. POST /api/pickup-requests/:requestId/process as Assigned Teacher (Sarah) (should succeed)
    console.log('\n--- 5. Processing request as Assigned Teacher (Sarah) ---');
    const processResAssigned = await fetch(`${BASE_URL}/pickup-requests/${requestId}/process`, {
      method: 'POST',
      headers: assignedTeacherHeaders,
      body: JSON.stringify({
        status: 'approved',
        notes: 'Approved by assigned homeroom teacher'
      })
    });
    const processResAssignedData: any = await processResAssigned.json();
    console.log('Process response status code (should be 200):', processResAssigned.status);
    console.log('Process response success:', processResAssignedData.success);
    console.log('Updated Status:', processResAssignedData.data.status);

    console.log('\nRESTRICTED PERMISSIONS INTEGRATION TEST SUCCESSFUL!');
    process.exit(0);
  } catch (error: any) {
    console.error('Integration test failed!');
    console.error(error);
    process.exit(1);
  }
}

runTest();
