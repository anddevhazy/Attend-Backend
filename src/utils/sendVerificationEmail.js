import nodemailer from 'nodemailer';
import { InternalServerError } from '../errors/index.js';

const sendVerificationEmail = async (user, token) => {
  try {
    const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`; //I'm using this one to create the special URL with the token attached, so the user can confirm their email by clicking it.

    // 1. I'm creating a transporter for defining how to send emails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // my  email
        pass: process.env.EMAIL_PASS, // my  app password
      },
    });

    // 2. I define the email content
    const mailOptions = {
      from: `"Attendance System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Verify your email',
      html: `
        <h1>Email Verification</h1>
        <p>Hello ${user.name},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">${verificationLink}</a>
      `,
    };

    // 3. Email gets sent
    await transporter.sendMail(mailOptions);

    return true;
  } catch (error) {
    console.error(error);
    throw new InternalServerError('Failed to send verification email');
  }
};

export default sendVerificationEmail;
