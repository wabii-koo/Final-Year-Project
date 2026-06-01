import fetch from 'node-fetch'; // wait, node-fetch might not be installed, we can use dynamic import or just standard http

async function runTest() {
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.smith@school.com',
        password: 'Smith1A@2026',
        role: 'homeroom'
      })
    });
    
    const loginData = await loginRes.json() as any;
    console.log('Login status:', loginRes.status);
    if (!loginData.success) {
      console.log('Login failed:', loginData);
      process.exit(1);
    }
    
    const token = loginData.data.token;
    console.log('Login successful, token retrieved.');

    // 1. Fetch classrooms
    const classesRes = await fetch('http://localhost:3000/api/teacher/classes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const classesData = await classesRes.json() as any;
    console.log('Classes status:', classesRes.status);
    console.log('Classes data:', JSON.stringify(classesData, null, 2));

    const classId = classesData.data?.classes?.[0]?.classId;
    console.log('Using classId:', classId);

    // 2. Fetch homework with classId
    const homeworkRes = await fetch(`http://localhost:3000/api/homework?classId=${classId || ''}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const homeworkData = await homeworkRes.json() as any;
    console.log('Homework status:', homeworkRes.status);
    console.log('Homework data:', JSON.stringify(homeworkData, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error during API test:', err);
    process.exit(1);
  }
}

runTest();
