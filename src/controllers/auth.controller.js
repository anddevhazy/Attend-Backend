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
import RefreshToken from '../models/refresh_token_model.js';
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  newJti,
  getRefreshExpiryDate,
} from '../utils/auth/tokens.js';
import jwt from 'jsonwebtoken';

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
    const emailVerificationToken = lecturer.generateEmailVerificationToken();

    // lecturer.emailVerificationToken = emailVerificationToken;
    await lecturer.save();

    // Send verification email
    const verificationLink = `${process.env.APP_URL}/api/v1/auth/verify-lecturer-email?token=${emailVerificationToken}`;
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

    // Validate required fields
    validateRequiredFieldsUtil(['email', 'password'], req.body);

    // Create student account
    const student = await Student.create({
      email,
      password,
      role: 'student',
    });

    // Generate email verification token
    const emailVerificationToken = student.generateEmailVerificationToken();
    const verificationLink = `${process.env.APP_URL}/api/v1/auth/verify-student-email?token=${emailVerificationToken}`;

    // Attempt to send verification email, but don't fail signup if email fails
    let emailSent = true;
    try {
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
            If you didn't request this verification, please ignore this email.
          </p>
        `,
      });
      console.log(`✅ Verification email sent to ${email}`);
    } catch (err) {
      console.error(`❌ Failed to send verification email to ${email}`, err);
      emailSent = false;
    }

    // Return account info and email status
    return res.status(201).json({
      success: true,
      data: {
        id: student._id,
        email: student.email,
      },
      message: emailSent
        ? 'Account created & verification email sent'
        : 'Account created, but failed to send verification email. Please contact support or try again.',
      emailSent,
    });
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
    const { email, password, deviceId } = req.body;

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

    const accessToken = createAccessToken({
      id: lecturer._id,
      email: lecturer.email,
      role: lecturer.role,
      userType: 'lecturer',
    });

    const jti = newJti();
    const refreshToken = createRefreshToken({
      id: lecturer._id,
      userType: 'lecturer',
      deviceId: deviceId || null,
      jti,
    });
    await RefreshToken.create({
      userId: lecturer._id,
      userType: 'lecturer',
      deviceId: deviceId || null,
      jti,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshExpiryDate(),
    });

    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        accessToken,
        refreshToken,
        student: {
          id: lecturer._id,
          email: lecturer.email,
          role: lecturer.role,
        },
      },
      'Login successful'
    );
  } catch (error) {
    console.error('LECTURER Login Error:', error);
    next(error);
  }
};

export const studentLogin = async (req, res, next) => {
  try {
    const { email, password, deviceId } = req.body;

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

    const accessToken = createAccessToken({
      id: student._id,
      email: student.email,
      role: student.role,
      userType: 'student',
    });

    const jti = newJti();
    const refreshToken = createRefreshToken({
      id: student._id,
      userType: 'student',
      deviceId: deviceId || null,
      jti,
    });
    await RefreshToken.create({
      userId: student._id,
      userType: 'student',
      deviceId: deviceId || null,
      jti,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshExpiryDate(),
    });

    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        accessToken,
        refreshToken,
        student: { id: student._id, email: student.email, role: student.role },
      },
      'Login successful'
    );
  } catch (error) {
    console.error('STUDENT Login Error:', error);
    next(error);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    validateRequiredFieldsUtil(['refreshToken'], req.body);

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      throw new UnauthenticatedError('Invalid or expired refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new UnauthenticatedError('Invalid token type');
    }

    const stored = await RefreshToken.findOne({
      jti: decoded.jti,
      userId: decoded.id,
      userType: decoded.userType,
      revokedAt: null,
    });

    if (!stored) throw new UnauthenticatedError('Refresh token revoked');

    if (stored.tokenHash !== hashToken(refreshToken)) {
      // token reuse / tampering => revoke this session
      stored.revokedAt = new Date();
      await stored.save();
      throw new UnauthenticatedError('Refresh token invalid');
    }

    // ROTATE refresh token
    stored.revokedAt = new Date();
    await stored.save();

    // load user for email/role
    const user =
      decoded.userType === 'student'
        ? await Student.findById(decoded.id)
        : await Lecturer.findById(decoded.id);

    if (!user) throw new UnauthenticatedError('User not found');

    const newAccessToken = createAccessToken({
      id: user._id,
      email: user.email,
      role: user.role,
      userType: decoded.userType,
    });

    const newJ = newJti();
    const newRefreshToken = createRefreshToken({
      id: user._id,
      userType: decoded.userType,
      deviceId: decoded.deviceId || null,
      jti: newJ,
    });

    await RefreshToken.create({
      userId: user._id,
      userType: decoded.userType,
      deviceId: decoded.deviceId || null,
      jti: newJ,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: getRefreshExpiryDate(),
    });

    return formatResponseUtil(res, StatusCodes.OK, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    validateRequiredFieldsUtil(['refreshToken'], req.body);

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      // don’t reveal details
      return formatResponseUtil(res, StatusCodes.OK, null, 'Logged out');
    }

    await RefreshToken.updateOne(
      { jti: decoded.jti, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    return formatResponseUtil(res, StatusCodes.OK, null, 'Logged out');
  } catch (err) {
    next(err);
  }
};
