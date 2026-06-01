require('dotenv').config();
const { AuthService } = require('../dist/services/authService');
const { UserRole } = require('../dist/types');

async function testMessageDeletion() {
  try {
    console.log('🧪 Starting Message Deletion Test (JavaScript)...');

    // 1. Generate Auth Tokens
    const teacherToken = AuthService.generateToken({
      userId: 3,
      email: 'sarah.smith@school.com',
      role: 'homeroom_teacher',
      fullName: 'Ms. Sarah Smith'
    });

    const guardianToken = AuthService.generateToken({
      userId: 20,
      email: 'kumaakebede@gmail.com',
      role: 'guardian',
      fullName: 'welebkoo'
    });

    console.log('🔑 Tokens generated successfully.');

    // Helpers for fetch requests using Node's global fetch
    const apiCall = async (url, method, token, body) => {
      const response = await fetch(`http://localhost:3000${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });
      return { status: response.status, data: await response.json() };
    };

    // --- TEST 1: DELETE FOR ME (SELF) ---
    console.log('\n--- Test Case 1: Delete For Me ---');
    
    // Guardian sends message to Teacher
    console.log('Sending message from Guardian (20) to Teacher (3)...');
    const sendRes = await apiCall('/api/messages', 'POST', guardianToken, {
      receiverId: 3,
      content: 'This is a secret message to be deleted for me only!',
      messageType: 'general'
    });
    
    if (sendRes.status !== 201) {
      console.error('❌ Failed to send message:', sendRes.data);
      process.exit(1);
    }
    
    const messageId = sendRes.data.data.messageId;
    console.log(`✅ Message sent with ID: ${messageId}`);

    // Verify Guardian can see it
    console.log('Fetching messages for Guardian...');
    const guardianMsgs = await apiCall('/api/messages', 'GET', guardianToken);
    const hasMsgGuardian = guardianMsgs.data.data.messages.some(m => m.messageId === messageId);
    console.log(`Guardian sees message: ${hasMsgGuardian} (expected: true)`);
    if (!hasMsgGuardian) process.exit(1);

    // Verify Teacher can see it
    console.log('Fetching messages for Teacher...');
    const teacherMsgs = await apiCall('/api/messages', 'GET', teacherToken);
    const hasMsgTeacher = teacherMsgs.data.data.messages.some(m => m.messageId === messageId);
    console.log(`Teacher sees message: ${hasMsgTeacher} (expected: true)`);
    if (!hasMsgTeacher) process.exit(1);

    // Guardian deletes message for self
    console.log('Guardian deleting message "for me"...');
    const deleteSelfRes = await apiCall(`/api/messages/${messageId}?type=self`, 'DELETE', guardianToken);
    console.log('Delete status:', deleteSelfRes.status, deleteSelfRes.data.message);
    if (deleteSelfRes.status !== 200) process.exit(1);

    // Verify Guardian CANNOT see it anymore
    const guardianMsgsAfter = await apiCall('/api/messages', 'GET', guardianToken);
    const hasMsgGuardianAfter = guardianMsgsAfter.data.data.messages.some(m => m.messageId === messageId);
    console.log(`Guardian sees message after deletion: ${hasMsgGuardianAfter} (expected: false)`);
    if (hasMsgGuardianAfter) process.exit(1);

    // Verify Teacher STILL sees it
    const teacherMsgsAfter = await apiCall('/api/messages', 'GET', teacherToken);
    const hasMsgTeacherAfter = teacherMsgsAfter.data.data.messages.some(m => m.messageId === messageId);
    console.log(`Teacher sees message after deletion: ${hasMsgTeacherAfter} (expected: true)`);
    if (!hasMsgTeacherAfter) process.exit(1);

    // --- TEST 2: DELETE FOR EVERYONE (BOTH) ---
    console.log('\n--- Test Case 2: Delete For Everyone (Unsend) ---');

    // Guardian sends another message to Teacher
    console.log('Sending another message from Guardian (20) to Teacher (3)...');
    const sendRes2 = await apiCall('/api/messages', 'POST', guardianToken, {
      receiverId: 3,
      content: 'This message will be deleted for everyone!',
      messageType: 'general'
    });
    
    if (sendRes2.status !== 201) {
      console.error('❌ Failed to send message:', sendRes2.data);
      process.exit(1);
    }
    
    const messageId2 = sendRes2.data.data.messageId;
    console.log(`✅ Message sent with ID: ${messageId2}`);

    // Guardian deletes message for everyone (type=both)
    console.log('Guardian deleting message "for everyone"...');
    const deleteBothRes = await apiCall(`/api/messages/${messageId2}?type=both`, 'DELETE', guardianToken);
    console.log('Delete status:', deleteBothRes.status, deleteBothRes.data.message);
    if (deleteBothRes.status !== 200) process.exit(1);

    // Verify Guardian CANNOT see it
    const guardianMsgsAfterBoth = await apiCall('/api/messages', 'GET', guardianToken);
    const hasMsgGuardianAfterBoth = guardianMsgsAfterBoth.data.data.messages.some(m => m.messageId === messageId2);
    console.log(`Guardian sees message after unsend: ${hasMsgGuardianAfterBoth} (expected: false)`);
    if (hasMsgGuardianAfterBoth) process.exit(1);

    // Verify Teacher CANNOT see it either
    const teacherMsgsAfterBoth = await apiCall('/api/messages', 'GET', teacherToken);
    const hasMsgTeacherAfterBoth = teacherMsgsAfterBoth.data.data.messages.some(m => m.messageId === messageId2);
    console.log(`Teacher sees message after unsend: ${hasMsgTeacherAfterBoth} (expected: false)`);
    if (hasMsgTeacherAfterBoth) process.exit(1);

    // --- TEST 3: UNAUTHORIZED DELETE FOR EVERYONE ---
    console.log('\n--- Test Case 3: Unauthorized Delete For Everyone ---');

    // Send a message from Guardian to Teacher
    console.log('Sending message from Guardian (20) to Teacher (3)...');
    const sendRes3 = await apiCall('/api/messages', 'POST', guardianToken, {
      receiverId: 3,
      content: 'Teacher trying to unsend Guardian message...',
      messageType: 'general'
    });
    const messageId3 = sendRes3.data.data.messageId;

    // Teacher tries to delete for everyone (type=both) on message they DID NOT send
    console.log('Teacher trying to delete Guardian message for everyone...');
    const deleteUnauthRes = await apiCall(`/api/messages/${messageId3}?type=both`, 'DELETE', teacherToken);
    console.log(`Teacher delete status (expected 403): ${deleteUnauthRes.status}`);
    if (deleteUnauthRes.status !== 403) {
      console.error('❌ Expected 403 Forbidden for unauthorized deletion!');
      process.exit(1);
    }
    console.log('✅ Correctly forbidden.');

    // Cleanup: delete messages
    await apiCall(`/api/messages/${messageId3}?type=both`, 'DELETE', guardianToken);
    await apiCall(`/api/messages/${messageId}?type=both`, 'DELETE', teacherToken);

    console.log('\n🎉 All Message Deletion tests passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during message deletion tests:', err);
    process.exit(1);
  }
}

testMessageDeletion();
