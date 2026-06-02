import http from 'http';

async function post(url: string, body: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseBody
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('1. Attempting login to get JWT token...');
    const loginRes = await post('http://localhost:3000/api/auth/login', {
      email: 'director@school.com',
      password: 'director123',
      role: 'director'
    });

    console.log('Login Status:', loginRes.statusCode);
    console.log('Login Response:', loginRes.body);

    if (loginRes.statusCode !== 200) {
      throw new Error('Login failed!');
    }

    const loginData = JSON.parse(loginRes.body);
    const token = loginData.data?.token || loginData.token;
    if (!token) {
      throw new Error('No token returned from login!');
    }

    console.log('Login successful! Token acquired.');

    console.log('2. Sending POST request to schedule event...');
    const eventPayload = {
      title: 'hhdhdjljgdfklvlk',
      description: 'dhfdjglkfgl;kllf;gfl',
      eventDate: '2026-06-03T19:26',
      eventType: 'activity',
      location: 'yruetrieeigoir',
      targetAudience: 'all'
    };

    const eventRes = await post('http://localhost:3000/api/events', eventPayload, token);

    console.log('Event Status:', eventRes.statusCode);
    console.log('Event Response:', eventRes.body);

  } catch (error: any) {
    console.error('Error running test:', error.message);
  }
}

main();
