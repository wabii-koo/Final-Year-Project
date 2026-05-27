

async function test() {
  try {
    console.log('Logging in as Sarah Smith...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.smith@school.com',
        password: 'Smith1A@2024',
        role: 'homeroom_teacher'
      })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.data?.token || loginData.token;
    if (!token) {
      throw new Error('Token not found in login response: ' + JSON.stringify(loginData));
    }
    
    console.log('Successfully logged in. Token obtained.');
    
    console.log('\n--- Fetching ALL assigned classes (no parameter) ---');
    const allRes = await fetch('http://localhost:3000/api/teacher/classes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const allData = await allRes.json();
    console.log(JSON.stringify(allData.data?.classes || allData, null, 2));
    
    console.log('\n--- Fetching ONLY subject classes (onlySubjectClasses=true) ---');
    const filteredRes = await fetch('http://localhost:3000/api/teacher/classes?onlySubjectClasses=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const filteredData = await filteredRes.json();
    console.log(JSON.stringify(filteredData.data?.classes || filteredData, null, 2));
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
