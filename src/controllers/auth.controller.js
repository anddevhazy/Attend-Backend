import { StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError } from '../errors/index.js';
import formatResponseUtil from '../utils/global/format_response_util.js';
import validateRequiredFieldsUtil from '../utils/global/validate_required_fields_util.js';
import Lecturer from '../models/lecturer_model.js';
import jwt from 'jsonwebtoken';
import sendEmailVerificationLink from '../utils/auth/send_email_verification_link_util.js';

export const lecturerSignUp = async (req, res, next) => {
  try {
    const { email, password, name, department, college } = req.body;

    // Ensure required fields are present
    validateRequiredFieldsUtil(
      ['email', 'password', 'name', 'department', 'college'],
      req.body
    );

    // Find lecturer in pre-seeded DB
    const lecturer = await Lecturer.findOne({ email, role: 'lecturer' });
    if (!lecturer) {
      throw new NotFoundError('Lecturer not employed');
    }

    // Check if lecturer already signed up
    if (lecturer.isEmailVerified) {
      throw new BadRequestError('Lecturer has already signed up');
    }

    // Update lecturer info & hash password
    lecturer.name = name;
    lecturer.department = department;
    lecturer.college = college;
    lecturer.password = password; // pre-save hook will hash it

    // Generate email verification token (JWT)
    /*
    Personal Note: The purpose of an email verification token is to tie something that expires with the verification link
    if not , any link can actually be sent for verification, but if it doesn't have a token, expiry feature wouldn't be possible.
    */
    const emailVerificationToken = jwt.sign(
      { id: lecturer._id, email: lecturer.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // lecturer.emailVerificationToken = emailVerificationToken;
    await lecturer.save();

    // Send verification email
    // 🔗 Dummy verification link (for testing email delivery)
    const verificationLink = `${process.env.APP_URL}/api/v1/auth/verify-email?token=${emailVerificationToken}`;
    await sendEmailVerificationLink({
      to: lecturer.email,
      subject: 'Verify Your Email',
      html: `
        <p>Hello ${lecturer.name},</p>
        <p>Welcome to Attend! Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}" target="_blank" 
           style="display:inline-block;background:#007bff;color:#fff;
                  padding:10px 15px;text-decoration:none;border-radius:5px;">
          Verify Email
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${verificationLink}</p>
        <hr />
        <p style="font-size:0.9em;color:#777;">
          If you didn't request this verification, please ignore this email or do not click the link.
        </p>
      `,
    });

    console.log(`✅ Controller has sent Verification email sent to ${email}`);
    return formatResponseUtil(
      res,
      StatusCodes.OK,
      `Verification email sent to : ${email}`
    );
  } catch (error) {
    console.error('LECTURER SignUp Error', error);
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) throw new BadRequestError('Missing Email Verification token');

    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, email } = decoded;

    // Find lecturer and verify
    const lecturer = await Lecturer.findOne({ _id: id, email });
    if (!lecturer) throw new BadRequestError('Invalid Email Verification Link');

    if (lecturer.isEmailVerified) {
      return res
        .status(StatusCodes.OK)
        .send('<h2>Email already verified ✅</h2>');
    }

    lecturer.isEmailVerified = true;
    await lecturer.save();

    // Simple success page (HTML for browser)
    res
      .status(StatusCodes.OK)
      .send(
        '<h2>✅ Your email has been verified. You can now log in to the app.</h2>'
      );
  } catch (error) {
    console.error('Email verification error:', error);
    if (error.name === 'TokenExpiredError') {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(
          '<h2>❌ Verification link has expired. Please request a new one.</h2>'
        );
    }
    next(error);
  }
};
