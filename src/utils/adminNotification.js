import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const notifyAdmins = async (subject, message) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAILS,
      subject: `ALERT: ${subject}`,
      text: message,
    });
    console.log(`Admin notification sent: ${subject}`);
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
};
