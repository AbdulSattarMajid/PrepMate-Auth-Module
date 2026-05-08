const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter optimized for cloud deployment
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    // We remove the hardcoded port 465 to let Nodemailer 
    // negotiate the best connection (usually 587) for Render.
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
    tls: {
      // This is crucial for bypasses on certain cloud networks
      rejectUnauthorized: false 
    }
  });

  // 2. Define email options
  const mailOptions = {
    from: `"PrepMate Team" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3. Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;