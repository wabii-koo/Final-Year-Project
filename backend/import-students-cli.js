// Developer CLI Tool for bulk importing students
// Usage: node import-students-cli.js <path_to_csv_file>

const http = require('http');
const fs = require('fs');
const path = require('path');

const csvFileArg = process.argv[2];
if (!csvFileArg) {
  console.error('❌ Error: Please specify a CSV file path.');
  console.log('Usage: node import-students-cli.js <path_to_csv_file>');
  process.exit(1);
}

const csvFilePath = path.resolve(csvFileArg);
if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ Error: CSV file not found at: ${csvFilePath}`);
  process.exit(1);
}

async function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Length'] = Buffer.byteLength(dataString);

    const req = http.request({
      hostname: 'localhost',
      port: 3001, // NextJS Rewrites Proxy (or use 3000 for direct Express)
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

async function uploadCSV(filePath, token) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundaryImportStudents';
    const filename = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    let body = [];
    body.push(Buffer.from(`--${boundary}\r\n`));
    body.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`));
    body.push(Buffer.from('Content-Type: text/csv\r\n\r\n'));
    body.push(fileContent);
    body.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const totalLength = body.reduce((sum, buf) => sum + buf.length, 0);
    const finalBuffer = Buffer.concat(body, totalLength);

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/registration/registrar/students/import',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': finalBuffer.length
      }
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
    req.write(finalBuffer);
    req.end();
  });
}

async function run() {
  console.log('🏁 Initiating bulk student upload...');
  
  // 1. Authenticate as Registrar
  console.log('🔐 Authenticating as Registrar (registrar@school.com)...');
  const loginRes = await apiRequest('POST', '/api/auth/login', {
    email: 'registrar@school.com',
    password: 'registrar456',
    role: 'registrar'
  });

  const token = loginRes.data?.token || loginRes.data?.data?.token;
  if (!token) {
    console.error('❌ Authentication failed:', loginRes.data);
    process.exit(1);
  }
  console.log('🔓 Authentication successful!');

  // 2. Upload the file
  console.log(`📤 Uploading CSV file: ${csvFilePath}...`);
  const uploadRes = await uploadCSV(csvFilePath, token);

  if (uploadRes.status === 200) {
    console.log('🎉 Bulk import completed successfully!');
    console.log('📋 Summary:', JSON.stringify(uploadRes.data, null, 2));
  } else {
    console.error(`❌ Upload failed with status ${uploadRes.status}:`, uploadRes.data);
  }
}

run().catch(err => console.error('❌ Error during import:', err));
