const http = require('http');

async function apiRequest(port, method, path, body = null, token = null) {
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
      port: port,
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
  const ports = [3000, 3001];
  let port = 3001;
  
  // Probe port
  try {
    const res = await apiRequest(3001, 'GET', '/api/health');
    console.log('Using port 3001');
  } catch (e) {
    port = 3000;
    console.log('Using port 3000');
  }

  console.log('--- FETCHING HOMEWORK FOR SARAH SMITH ---');
  const loginRes = await apiRequest(port, 'POST', '/api/auth/login', {
    email: 'sarah.smith@school.com',
    password: 'Smith1A@2024',
    role: 'homeroom_teacher'
  });
  
  console.log('Login Status:', loginRes.status);
  const token = loginRes.data?.token || loginRes.data?.data?.token;
  if (!token) {
    console.error('Failed to login:', loginRes.data);
    process.exit(1);
  }

  const homeworkListRes = await apiRequest(port, 'GET', '/api/homework', null, token);
  console.log('Fetch Status:', homeworkListRes.status);
  
  const homework = homeworkListRes.data?.data?.homework || [];
  console.log(`Found ${homework.length} homework assignments for Ms. Sarah Smith.`);
  
  const id18Homework = homework.find(h => h.homeworkId === 18);
  if (id18Homework) {
    console.error('FAIL: Homework ID 18 ("how does people interact with each other") is STILL in Sarah Smith\'s dashboard!');
    console.error(id18Homework);
    process.exit(1);
  } else {
    console.log('SUCCESS: Homework ID 18 is NOT present in Sarah Smith\'s dashboard list.');
  }

  console.log('\nList of homework assignments for Ms. Sarah Smith:');
  homework.forEach(h => {
    console.log(`- [ID: ${h.homeworkId}] ${h.title} (Class: ${h.className}, Teacher: ${h.teacherName})`);
  });
  
  // Let's also check if Sarah Smith can access analytics of Emily Davis's homework (ID 18) - it should fail with 403.
  console.log('\nChecking if Sarah Smith can access Emily Davis\'s homework (ID 18) analytics...');
  const analyticsRes = await apiRequest(port, 'GET', '/api/homework/18/analytics', null, token);
  console.log('Access Status (Should be 403):', analyticsRes.status);
  console.log('Response:', analyticsRes.data);

  console.log('\n--- FETCHING HOMEWORK FOR EMILY DAVIS ---');
  const loginResEmily = await apiRequest(port, 'POST', '/api/auth/login', {
    email: 'emily.davis@school.com',
    password: 'Davis3B@2024',
    role: 'homeroom_teacher'
  });
  
  console.log('Login Status:', loginResEmily.status);
  const tokenEmily = loginResEmily.data?.token || loginResEmily.data?.data?.token;
  if (!tokenEmily) {
    console.error('Failed to login Emily Davis:', loginResEmily.data);
    process.exit(1);
  }

  const homeworkListEmilyRes = await apiRequest(port, 'GET', '/api/homework', null, tokenEmily);
  console.log('Fetch Status:', homeworkListEmilyRes.status);
  
  const homeworkEmily = homeworkListEmilyRes.data?.data?.homework || [];
  console.log(`Found ${homeworkEmily.length} homework assignments for Mrs. Emily Davis.`);
  
  const id18HomeworkEmily = homeworkEmily.find(h => h.homeworkId === 18);
  if (!id18HomeworkEmily) {
    console.error('FAIL: Homework ID 18 ("how does people interact with each other") is NOT in Emily Davis\'s dashboard!');
    process.exit(1);
  } else {
    console.log('SUCCESS: Homework ID 18 IS present in Emily Davis\'s dashboard list.');
  }

  const sarahHwInEmily = homeworkEmily.find(h => h.teacherName === 'Ms. Sarah Smith');
  if (sarahHwInEmily) {
    console.error(`FAIL: Emily Davis can see Sarah Smith's homework: ID ${sarahHwInEmily.homeworkId} ("${sarahHwInEmily.title}")!`);
    process.exit(1);
  } else {
    console.log('SUCCESS: Sarah Smith\'s homework assignments are NOT present in Emily Davis\'s dashboard.');
  }

  console.log('\nList of homework assignments for Mrs. Emily Davis:');
  homeworkEmily.forEach(h => {
    console.log(`- [ID: ${h.homeworkId}] ${h.title} (Class: ${h.className}, Teacher: ${h.teacherName})`);
  });

  console.log('\nChecking if Emily Davis can access her own homework (ID 18) analytics...');
  const analyticsEmilyRes = await apiRequest(port, 'GET', '/api/homework/18/analytics', null, tokenEmily);
  console.log('Access Status (Should be 200):', analyticsEmilyRes.status);
  console.log('Response:', analyticsEmilyRes.data);

}

runTests().catch(e => {
  console.error('Verification script failed:', e);
  process.exit(1);
});
