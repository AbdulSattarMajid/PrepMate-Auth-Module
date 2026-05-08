const axios = require('axios');

const sendEmail = async (options) => {
  try {
    // Pulling both from .env for maximum security and flexibility
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.EMAIL_USER; 

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { 
        name: "PrepMate Team", 
        email: senderEmail 
      },
      to: [{ email: options.email }],
      subject: options.subject,
      textContent: options.message,
    }, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      }
    });

    console.log("SUCCESS: Email sent via Brevo API using .env config");
  } catch (error) {
    console.error("BREVO ERROR:", error.response ? error.response.data : error.message);
    throw new Error("Email delivery failed.");
  }
};

module.exports = sendEmail;