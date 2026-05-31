import { AuthService } from '../src/services/authService';

async function testPasswordHashing() {
  console.log('Testing password verification...');
  const plainPassword = 'CorrectPassword123!';
  const wrongPassword = 'WrongPassword!';
  
  const hash = await AuthService.hashPassword(plainPassword);
  console.log('Password hash generated:', hash);

  const matchCorrect = await AuthService.comparePassword(plainPassword, hash);
  const matchWrong = await AuthService.comparePassword(wrongPassword, hash);

  console.log('Match with correct password (expected: true):', matchCorrect);
  console.log('Match with wrong password (expected: false):', matchWrong);

  if (matchCorrect && !matchWrong) {
    console.log('✅ Password comparison logic is working perfectly!');
  } else {
    console.error('❌ Password comparison logic failed!');
  }
}

function testFinRegex() {
  console.log('\nTesting FIN validation regex...');
  const finRegex = /^\d{12}$/;

  const testCases = [
    { input: '123456789012', expected: true },
    { input: '12345678901', expected: false }, // 11 digits
    { input: '1234567890123', expected: false }, // 13 digits
    { input: '12345678901a', expected: false }, // letters
    { input: '1234 5678 9012', expected: false }, // spaces
    { input: '12345678901@', expected: false }, // special chars
  ];

  let allPassed = true;
  for (const { input, expected } of testCases) {
    const result = finRegex.test(input);
    const passed = result === expected;
    console.log(`Input: "${input}" | Expected: ${expected} | Result: ${result} | ${passed ? '✅' : '❌'}`);
    if (!passed) allPassed = false;
  }

  if (allPassed) {
    console.log('✅ All FIN validation test cases passed successfully!');
  } else {
    console.error('❌ Some FIN validation test cases failed!');
  }
}

async function run() {
  await testPasswordHashing();
  testFinRegex();
}

run().catch(console.error);
