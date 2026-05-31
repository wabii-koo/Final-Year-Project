// test_homework_validation.js – tests backend restrictions on homework creation based on verified teacher mappings
const http = require('http');

async function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Length'] = Buffer.byteLength(dataString);

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('🏁 Initiating Updated Homework Validation Tests (Based on Image)...');

  // 1. Log in as Mr. Robert Miller (Mathematics, user_id: 15)
  console.log('\n🔐 Authenticating as Mr. Robert Miller (Mathematics)...');
  const loginMiller = await apiRequest('POST', '/api/auth/login', {
    email: 'robert.miller@school.com',
    password: 'MillerMath@2024',
    role: 'teacher'
  });
  
  const tokenMiller = loginMiller.data?.data?.token;
  if (!tokenMiller) {
    console.error('❌ Miller Login failed:', loginMiller.data);
    return;
  }
  console.log('🔓 Miller Login successful!');

  // Test 1: Robert Miller posts Mathematics homework to Grade 1-A (He teaches this)
  console.log('\n🧪 Test 1: Robert Miller posting Mathematics to Grade 1-A (Expected: SUCCESS 201)');
  const res1 = await apiRequest('POST', '/api/homework', {
    title: 'Fractions Basics',
    description: 'Solve page 12 exercises.',
    subject: 'Mathematics',
    className: 'Grade 1-A',
    dueDate: new Date(Date.now() + 86400000).toISOString()
  }, tokenMiller);
  console.log(`Status: ${res1.status}, Message: ${res1.data.message || res1.data.error?.message}`);

  // Test 2: Robert Miller posts Mathematics homework to Grade 2-B (He does NOT teach Grade 2-B)
  console.log('\n🧪 Test 2: Robert Miller posting Mathematics to Grade 2-B (Expected: FORBIDDEN 403)');
  const res2 = await apiRequest('POST', '/api/homework', {
    title: 'Algebra Review',
    description: 'Solve equations.',
    subject: 'Mathematics',
    className: 'Grade 2-B',
    dueDate: new Date(Date.now() + 86400000).toISOString()
  }, tokenMiller);
  console.log(`Status: ${res2.status}, Message: ${res2.data.message || res2.data.error?.message}`);


  // 2. Log in as Dr. Lisa Green (Science, user_id: 16)
  console.log('\n🔐 Authenticating as Dr. Lisa Green (Science)...');
  const loginGreen = await apiRequest('POST', '/api/auth/login', {
    email: 'lisa.green@school.com',
    password: 'GreenScience@2024',
    role: 'teacher'
  });
  
  const tokenGreen = loginGreen.data?.data?.token;
  if (!tokenGreen) {
    console.error('❌ Green Login failed:', loginGreen.data);
    return;
  }
  console.log('🔓 Green Login successful!');

  // Test 3: Dr. Lisa Green posts Science homework to Grade 2-B (She teaches this)
  console.log('\n🧪 Test 3: Dr. Lisa Green posting Science to Grade 2-B (Expected: SUCCESS 201)');
  const res3 = await apiRequest('POST', '/api/homework', {
    title: 'Force and Motion',
    description: 'Answer questions in workbook.',
    subject: 'Science',
    className: 'Grade 2-B',
    dueDate: new Date(Date.now() + 86400000).toISOString()
  }, tokenGreen);
  console.log(`Status: ${res3.status}, Message: ${res3.data.message || res3.data.error?.message}`);

  // Test 4: Dr. Lisa Green posts Science homework to Grade 3-B (She does NOT teach Grade 3-B)
  console.log('\n🧪 Test 4: Dr. Lisa Green posting Science to Grade 3-B (Expected: FORBIDDEN 403)');
  const res4 = await apiRequest('POST', '/api/homework', {
    title: 'Space Exploration',
    description: 'Draw the solar system.',
    subject: 'Science',
    className: 'Grade 3-B',
    dueDate: new Date(Date.now() + 86400000).toISOString()
  }, tokenGreen);
  console.log(`Status: ${res4.status}, Message: ${res4.data.message || res4.data.error?.message}`);


  // 3. Log in as Ms. Sarah Smith (Homeroom Grade 1-A, user_id: 3)
  console.log('\n🔐 Authenticating as Ms. Sarah Smith (Homeroom Grade 1-A)...');
  const loginSmith = await apiRequest('POST', '/api/auth/login', {
    email: 'sarah.smith@school.com',
    password: 'Smith1A@2024',
    role: 'homeroom'
  });
  
  const tokenSmith = loginSmith.data?.data?.token;
  if (!tokenSmith) {
    console.error('❌ Smith Login failed:', loginSmith.data);
    return;
  }
  console.log('🔓 Smith Login successful!');

  // Test 5: Sarah Smith posts English homework to Grade 2-B (She teaches English in 2-B)
  console.log('\n🧪 Test 5: Sarah Smith posting English to Grade 2-B (Expected: SUCCESS 201)');
  const res5 = await apiRequest('POST', '/api/homework', {
    title: 'Grammar Exercise',
    description: 'Complete nouns worksheet.',
    subject: 'English',
    className: 'Grade 2-B',
    dueDate: new Date(Date.now() + 86400000).toISOString()
  }, tokenSmith);
  console.log(`Status: ${res5.status}, Message: ${res5.data.message || res5.data.error?.message}`);

  // Test 6: Sarah Smith posts Mathematics homework to Grade 2-B (She does NOT teach Mathematics in 2-B)
  console.log('\n🧪 Test 6: Sarah Smith posting Mathematics to Grade 2-B (Expected: FORBIDDEN 403)');
  const res6 = await apiRequest('POST', '/api/homework', {
    title: 'Math Homework',
    description: 'Geometry practice.',
    subject: 'Mathematics',
    className: 'Grade 2-B',
    dueDate: new Date(Date.now() + 86400000).toISOString()
  }, tokenSmith);
  console.log(`Status: ${res6.status}, Message: ${res6.data.message || res6.data.error?.message}`);

  console.log('\n🏁 Tests Completed.');
}

runTests().catch(console.error);
