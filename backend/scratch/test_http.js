const http = require('http');

const loginData = JSON.stringify({
  email: 'sarah.smith@school.com',
  password: 'Smith1A@2024',
  role: 'homeroom'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const req = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (!data.success) {
        console.error('Login failed:', data);
        process.exit(1);
      }
      const token = data.data.token;
      console.log('Login successful.');
      fetchHomework(token);
    } catch (e) {
      console.error('Failed to parse login response:', body);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('Login request error:', e);
  process.exit(1);
});

req.write(loginData);
req.end();

function fetchHomework(token) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/homework?classId=1',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req2 = http.request(options, (res2) => {
    let body = '';
    res2.on('data', (chunk) => body += chunk);
    res2.on('end', () => {
      console.log('Status code:', res2.statusCode);
      console.log('Response body:', body);
      process.exit(0);
    });
  });

  req2.on('error', (e) => {
    console.error('Homework request error:', e);
    process.exit(1);
  });

  req2.end();
}
