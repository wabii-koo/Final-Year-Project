const http = require('http');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables for DB access if needed
dotenv.config();

const { sequelize } = require('../src/database/connection');
const { StudentModel } = require('../src/models/Student');

async function apiRequest(port, method, apiPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: apiPath,
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
      req.write(body);
    }
    req.end();
  });
}

async function runTest() {
  try {
    // 1. Clean up any previous test students from DB directly
    await StudentModel.destroy({
      where: {
        fullName: ['Test CSV Student', 'Another CSV Student']
      }
    });
    console.log('Cleaned up previous test students in DB.');

    // 2. Log in as registrar (direct to backend port 3000 first)
    console.log('Logging in as registrar on port 3000...');
    const loginRes = await apiRequest(3000, 'POST', '/api/auth/login', {
      'Content-Type': 'application/json'
    }, JSON.stringify({
      email: 'registrar@school.com',
      password: 'registrar456',
      role: 'registrar'
    }));

    if (loginRes.status !== 200) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }

    const token = loginRes.data.data.token;
    console.log('Login successful! Token acquired.');

    // 3. Prepare CSV import payload using multipart/form-data
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const csvContent = `fullName,dob,emergencyContact,classLevel\nTest CSV Student,2015-05-15,+251911000000,Grade 1-A\nAnother CSV Student,2016-08-20,+251922000000,Grade 2-B`;
    
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="students.csv"\r\nContent-Type: text/csv\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const bodyBuffer = Buffer.concat([
      Buffer.from(header),
      Buffer.from(csvContent),
      Buffer.from(footer)
    ]);

    const importHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuffer.length
    };

    // 4. Test direct backend endpoint (port 3000)
    console.log('Uploading CSV to backend directly (port 3000)...');
    const importBackendRes = await apiRequest(3000, 'POST', '/api/registration/registrar/students/import', importHeaders, bodyBuffer);
    console.log('Direct Backend Status:', importBackendRes.status);
    console.log('Direct Backend Data:', JSON.stringify(importBackendRes.data, null, 2));

    if (importBackendRes.status !== 200 || !importBackendRes.data.success) {
      throw new Error('Direct backend import failed!');
    }

    // Clean up again to test via Next.js frontend proxy (port 3001)
    await StudentModel.destroy({
      where: {
        fullName: ['Test CSV Student', 'Another CSV Student']
      }
    });
    console.log('Cleaned up students for frontend proxy test.');

    // 5. Test Next.js frontend proxy rewrite (port 3001)
    console.log('Uploading CSV via Next.js proxy (port 3001)...');
    const importProxyRes = await apiRequest(3001, 'POST', '/api/registration/registrar/students/import', importHeaders, bodyBuffer);
    console.log('Frontend Proxy Status:', importProxyRes.status);
    console.log('Frontend Proxy Data:', JSON.stringify(importProxyRes.data, null, 2));

    if (importProxyRes.status !== 200 || !importProxyRes.data.success) {
      throw new Error('Frontend proxy import failed!');
    }

    // 6. Final verification in DB
    const insertedStudents = await StudentModel.findAll({
      where: {
        fullName: ['Test CSV Student', 'Another CSV Student']
      }
    });

    console.log(`Verified in DB: Found ${insertedStudents.length} matching students.`);
    for (const student of insertedStudents) {
      console.log(`- Student: ${student.fullName}, DOB: ${student.dob}, ClassID: ${student.classId}`);
    }

    if (insertedStudents.length === 2) {
      console.log('\n=======================================');
      console.log('🎉 🎉 END-TO-END CSV IMPORT TEST PASSED! 🎉 🎉');
      console.log('=======================================');
      process.exit(0);
    } else {
      console.error('--- TEST FAILED! Expected 2 students, found ' + insertedStudents.length);
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ Test failed with error:', err.message || err);
    process.exit(1);
  }
}

runTest();
