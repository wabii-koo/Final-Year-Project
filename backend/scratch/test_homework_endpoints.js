// API verification script using pure Node fetch
// Run: node scratch/test_homework_endpoints.js

const http = require('http');

async function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: headers
    }, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING HOMEWORK API VERIFICATION TESTS ---');

  // 1. Login as Ms. Smith (Teacher, ID = 3, password = teacher789)
  console.log('\n[1] Logging in as Teacher (Ms. Smith)...');
  const loginTeacher = await apiRequest('POST', '/api/auth/login', {
    email: 'teacher@school.com',
    password: 'teacher789',
    role: 'teacher'
  });
  console.log('Teacher Login Response Status:', loginTeacher.status);
  const teacherToken = loginTeacher.data?.token || loginTeacher.data?.data?.token;
  if (!teacherToken) {
    console.error('Failed to get teacher token:', loginTeacher.data);
    process.exit(1);
  }
  console.log('Successfully logged in as Teacher!');

  // 2. Fetch homework as Teacher
  console.log('\n[2] Fetching homework assignments as Teacher...');
  const teacherHomeworkList = await apiRequest('GET', '/api/homework', null, teacherToken);
  console.log('Fetch Status:', teacherHomeworkList.status);
  console.log('Homework list (first 2 items):', teacherHomeworkList.data?.data?.homework?.slice(0, 2) || teacherHomeworkList.data);

  // 3. Login as Mr. Johnson (Homeroom Teacher, ID = 4, password = homeroom012)
  console.log('\n[3] Logging in as Homeroom Teacher (Mr. Johnson)...');
  const loginHomeroom = await apiRequest('POST', '/api/auth/login', {
    email: 'homeroom@school.com',
    password: 'homeroom012',
    role: 'homeroom_teacher'
  });
  console.log('Homeroom Login Response Status:', loginHomeroom.status);
  const homeroomToken = loginHomeroom.data?.token || loginHomeroom.data?.data?.token;
  if (!homeroomToken) {
    console.error('Failed to get homeroom token:', loginHomeroom.data);
    process.exit(1);
  }
  console.log('Successfully logged in as Homeroom Teacher!');

  // 4. Fetch homework as Homeroom Teacher
  console.log('\n[4] Fetching homework assignments as Homeroom Teacher...');
  const homeroomHomeworkList = await apiRequest('GET', '/api/homework', null, homeroomToken);
  console.log('Fetch Status:', homeroomHomeworkList.status);
  console.log('Homework list (first 2 items):', homeroomHomeworkList.data?.data?.homework?.slice(0, 2) || homeroomHomeworkList.data);

  // Get a specific homework id (e.g. homework_id 3, Practice Letters A-Z)
  const targetHomework = teacherHomeworkList.data?.data?.homework?.[0];
  if (!targetHomework) {
    console.error('No homework found in database to test individual routes!');
    process.exit(1);
  }
  const hwId = targetHomework.homeworkId || targetHomework.homework_id;
  console.log(`Using Homework ID ${hwId} for single-homework and analytics tests...`);

  // 5. Test single homework fetch as Teacher
  console.log(`\n[5] Fetching single homework #${hwId} as Teacher...`);
  const hwDetailTeacher = await apiRequest('GET', `/api/homework/${hwId}`, null, teacherToken);
  console.log('Teacher Detail Fetch Status:', hwDetailTeacher.status);
  console.log('Detail data:', hwDetailTeacher.data);

  // 6. Test Homework Analytics access as Teacher (Creator)
  console.log(`\n[6] Fetching homework #${hwId} analytics as Teacher (Creator)...`);
  const analyticsTeacher = await apiRequest('GET', `/api/homework/${hwId}/analytics`, null, teacherToken);
  console.log('Teacher Analytics Access Status:', analyticsTeacher.status);
  console.log('Analytics data:', analyticsTeacher.data);

  // 7. Login as Guardian (John Doe, ID = 5, password = password)
  console.log('\n[7] Logging in as Guardian (John Doe)...');
  const loginGuardian = await apiRequest('POST', '/api/auth/login', {
    email: 'guardian@example.com',
    password: 'password',
    role: 'guardian'
  });
  console.log('Guardian Login Status:', loginGuardian.status);
  const guardianToken = loginGuardian.data?.token || loginGuardian.data?.data?.token;
  if (!guardianToken) {
    console.error('Failed to get guardian token:', loginGuardian.data);
    process.exit(1);
  }
  console.log('Successfully logged in as Guardian!');

  // 8. Fetch homework as Guardian (should return homework for child class Grade 1-A)
  console.log('\n[8] Fetching homework assignments as Guardian...');
  const guardianHomeworkList = await apiRequest('GET', '/api/homework', null, guardianToken);
  console.log('Guardian Homework List Status:', guardianHomeworkList.status);
  console.log('Guardian Homework List:', guardianHomeworkList.data?.data?.homework || guardianHomeworkList.data);

  // 9. Guardian accessing single homework (Should succeed and register a view!)
  console.log(`\n[9] Fetching single homework #${hwId} as Guardian...`);
  const hwDetailGuardian = await apiRequest('GET', `/api/homework/${hwId}`, null, guardianToken);
  console.log('Guardian Single Homework Status:', hwDetailGuardian.status);
  console.log('Guardian Single Homework Detail:', hwDetailGuardian.data);

  // 9b. Register homework view
  console.log(`\n[9b] Registering homework #${hwId} view as Guardian...`);
  const viewRes = await apiRequest('POST', `/api/homework/${hwId}/view`, null, guardianToken);
  console.log('View registration status:', viewRes.status);
  console.log('View registration response:', viewRes.data);

  // 10. Guardian submitting feedback/questions on homework
  console.log(`\n[10] Submitting feedback/question on homework #${hwId} as Guardian...`);
  const feedbackRes = await apiRequest('POST', `/api/homework/${hwId}/feedback`, {
    feedback: 'How many sentences should they write for each letter?'
  }, guardianToken);
  console.log('Feedback submission status:', feedbackRes.status);
  console.log('Feedback response:', feedbackRes.data);

  // 11. Guardian trying to access analytics (Should be FORBIDDEN / UNAUTHORIZED)
  console.log(`\n[11] Guardian trying to access homework #${hwId} analytics...`);
  const analyticsGuardian = await apiRequest('GET', `/api/homework/${hwId}/analytics`, null, guardianToken);
  console.log('Guardian Analytics Access Status (Should be 403 Forbidden):', analyticsGuardian.status);
  console.log('Guardian Analytics Response:', analyticsGuardian.data);

  // 12. Fetch homework analytics again as Teacher (Should now contain the view and the feedback submission!)
  console.log(`\n[12] Fetching homework #${hwId} analytics as Teacher (Creator) again...`);
  const analyticsTeacher2 = await apiRequest('GET', `/api/homework/${hwId}/analytics`, null, teacherToken);
  console.log('Teacher Analytics Status:', analyticsTeacher2.status);
  console.log('Updated Analytics data:', JSON.stringify(analyticsTeacher2.data, null, 2));

  console.log('\n--- ALL VERIFICATION TESTS COMPLETED ---');
}

runTests().catch(e => { console.error('Verification script failed:', e); process.exit(1); });
