import { StatusCodes } from 'http-status-codes';
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from '../errors/index.js';
import formatResponseUtil from '../utils/global/format_response_util.js';
import validateRequiredFieldsUtil from '../utils/global/validate_required_fields_util.js';
import Lecturer from '../models/lecturer_model.js';
import Student from '../models/student_model.js';
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
    const emailVerificationToken = lecturer.generateToken();

    // lecturer.emailVerificationToken = emailVerificationToken;
    await lecturer.save();

    // Send verification email
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

export const verifyLecturerEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) throw new BadRequestError('Missing Email Verification token');

    // Decode token
    const decoded = Lecturer.verifyEmailVerificationToken(token);
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

export const studentSignUp = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    validateRequiredFieldsUtil(['email', 'password'], req.body);

    const student = await Student.create({
      email,
      password,
      role: 'student',
    });

    const emailVerificationToken = student.generateToken();

    // Send verification email
    const verificationLink = `${process.env.APP_URL}/api/v1/auth/verify-student-email?token=${emailVerificationToken}`;
    await sendEmailVerificationLink({
      to: student.email,
      subject: 'Verify Your Email',
      html: `
        <p>Hello,</p>
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

    console.log(
      `✅ Controller has created ${email}'s student document and sent Verification email to them`
    );
    return formatResponseUtil(
      res,
      StatusCodes.CREATED,
      {
        id: student._id,
        email: student.email,
      },
      'Student account created & Verification Email Sent'
    );
  } catch (error) {
    console.error('STUDENT SignUp Error', error);
    next(error);
  }
};

export const verifyStudentEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) throw new BadRequestError('Missing Email Verification token');

    // Decode token
    const decoded = Student.verifyEmailVerificationToken(token);
    const { id, email } = decoded;

    // Find lecturer and verify
    const student = await Student.findOne({ _id: id, email });
    if (!student) throw new BadRequestError('Invalid Email Verification Link');

    if (student.isEmailVerified) {
      return res
        .status(StatusCodes.OK)
        .send('<h2>Email already verified ✅</h2>');
    }

    student.isEmailVerified = true;
    await student.save();

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

export const lecturerLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    validateRequiredFieldsUtil(['email', 'password'], req.body);

    // Find lecturer by email
    const lecturer = await Lecturer.findOne({ email, role: 'lecturer' });
    if (!lecturer) {
      throw new UnauthenticatedError("Lecturer with this email doesn't exist ");
    }

    // Check if email is verified
    if (!lecturer.isEmailVerified) {
      throw new BadRequestError("Your email isn't verified yet");
    }

    // Verify password
    const isPasswordCorrect = await lecturer.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new UnauthenticatedError('Invalid  Password');
    }

    // Generate JWT token for session
    const token = lecturer.generateToken();

    // Return success response with token
    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        token,
        lecturer: {
          id: lecturer._id,
          email: lecturer.email,
          name: lecturer.name,
          role: lecturer.role,
          department: lecturer.department,
          college: lecturer.college,
        },
      },
      'Lecturer Login successful'
    );
  } catch (error) {
    console.error('LECTURER Login Error:', error);
    next(error);
  }
};

export const studentLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    validateRequiredFieldsUtil(['email', 'password'], req.body);

    // Find student by email
    const student = await Student.findOne({ email, role: 'student' });
    if (!student) {
      throw new UnauthenticatedError(" Student with this email doesn't exist");
    }

    // Check if email is verified
    if (!student.isEmailVerified) {
      throw new BadRequestError("Your email isn't verified yet");
    }

    // Verify password
    const isPasswordCorrect = await student.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new UnauthenticatedError('Invalid Password');
    }

    // Generate JWT token for session
    const token = student.generateToken();

    // Return success response with token
    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        token,
        student: {
          id: student._id,
          email: student.email,
          role: student.role,
        },
      },
      'Login successful'
    );
  } catch (error) {
    console.error('STUDENT Login Error:', error);
    next(error);
  }
};
