import nodemailer from 'nodemailer';

let lastNotificationTime = 0;
const notificationInterval = 60000; // 1 minute

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const notifyAdmins = async (subject, message, toEmails = null) => {
  const now = Date.now();
  if (now - lastNotificationTime < notificationInterval) {
    console.log('Skipping notification due to rate limit');
    return;
  }

  // Use provided emails (e.g., for verification) or fall back to ADMIN_EMAILS
  const recipients = toEmails
    ? toEmails.split(',').filter((email) => email.trim())
    : process.env.ADMIN_EMAILS?.split(',').filter((email) => email.trim()) ||
      [];

  if (!recipients || recipients.length === 0) {
    console.error('No valid recipients defined');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipients.join(','),
    subject: `ALERT: ${subject}`,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification sent: ${subject} to ${recipients.join(',')}`);
    lastNotificationTime = now;
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};
