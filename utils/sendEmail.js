const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail from Render Env
      pass: process.env.EMAIL_PASS, // The 16-digit App Password
    },
  });

  // 2. Define email options
  const mailOptions = {
    from: `"PrepMate Team" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // You can also use 'html' if you want a fancy design later
  };

  // 3. Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;