const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 465,
  secure: Number(process.env.MAIL_PORT) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 10000,
});

async function run() {
  try {
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('Transporter verification successful!');
    
    console.log('Sending test email to:', process.env.MAIL_USER);
    const info = await transporter.sendMail({
      from: `"School Communication" <${process.env.MAIL_FROM}>`,
      to: process.env.MAIL_USER,
      subject: 'Test Email - SMTP Configuration Verification',
      text: 'If you receive this, the nodemailer transporter is configured correctly.',
    });
    console.log('Email sent successfully! MessageId:', info.messageId);
  } catch (error) {
    console.error('Mail test failed:', error);
  }
  process.exit();
}

run();
