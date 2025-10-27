import nodemailer from 'nodemailer';

/**
 * Send an email using Nodemailer
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Subject of the email
 * @param {string} options.html - HTML body of the email
 * @param {string} [options.text] - Plain text version (optional)
 */
const sendEmailVerificationLink = async ({ to, subject, html, text }) => {
  try {
    // Create reusable transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send the email
    const mailOptions = {
      from: `Attend` < `${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅Nodemailer has sent Email to ${to}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Email sending failed');
  }
};

export default sendEmailVerificationLink;
