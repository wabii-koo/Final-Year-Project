// test_classes_api.js – logs in as Sarah Smith and tests the classes API
require('dotenv').config();
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

(async () => {
  try {
    const loginRes = await apiRequest('POST', '/api/auth/login', {
      email: 'sarah.smith@school.com',
      password: 'Smith1A@2024',
      role: 'homeroom'
    });
    const token = loginRes.data?.data?.token;
    if (!token) {
      console.error('❌ Login failed:', loginRes.data);
      return;
    }

    console.log('--- GET CLASSES (onlySubjectClasses=true) ---');
    const res1 = await apiRequest('GET', '/api/teacher/classes?onlySubjectClasses=true', null, token);
    console.log(JSON.stringify(res1.data, null, 2));

    console.log('--- GET CLASSES (default) ---');
    const res2 = await apiRequest('GET', '/api/teacher/classes', null, token);
    console.log(JSON.stringify(res2.data, null, 2));

  } catch (err) {
    console.error('❌ Error:', err);
  }
})();
