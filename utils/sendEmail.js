const { Resend } = require('resend');

// Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    const data = await resend.emails.send({
      from: 'PrepMate <onboarding@resend.dev>', // Default free sender
      to: options.email,
      subject: options.subject,
      text: options.message,
    });

    if (data.error) {
      console.error("RESEND ERROR:", data.error);
      throw new Error(data.error.message);
    }

    console.log("Email sent successfully via Resend:", data.data.id);
  } catch (error) {
    console.error("EMAIL UTILITY ERROR:", error);
    throw error; // Re-throw to be caught by the Controller
  }
};

module.exports = sendEmail;