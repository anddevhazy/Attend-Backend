// controllers/auth.controller.js
import { StatusCodes } from 'http-status-codes';
import {
  BadRequestError,
  NotFoundError,
  InternalServerError,
} from '../errors/index.js';
import formatResponse from '../utils/formatResponse.js';
import validateRequiredFields from '../utils/validateRequiredFields.js';
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Placeholder for OCR service (to be implemented based on chosen OCR library)
// eslint-disable-next-line no-unused-vars
const extractStudentDataFromImage = async (image) => {
  // Hypothetical OCR processing (e.g., using Tesseract.js or Google Vision API)
  // Returns { matricNumber, name, programme, level }
  try {
    // Example: await ocrService.processImage(image);
    return {
      matricNumber: 'ABC12345',
      name: 'John Doe',
      programme: 'Computer Science',
      level: '200L',
    };
    // eslint-disable-next-line no-unused-vars, no-unreachable
  } catch (error) {
    throw new InternalServerError(
      'Failed to process image for data extraction'
    );
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '7d' }
  );
};

// Send email verification (placeholder for email service)
const sendVerificationEmail = async (user, token) => {
  // Hypothetical email service (e.g., using Nodemailer or AWS SES)
  // Example: await emailService.sendEmail(user.email, 'Verify Email', link);
  try {
    const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`;
    console.log(
      `Sending verification email to ${user.email}: ${verificationLink}`
    );
    // Implement actual email sending logic here
    return true;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    throw new InternalServerError('Failed to send verification email');
  }
};

export const studentExtractData = async (req, res, next) => {
  try {
    const { image } = req.body; // Assuming image is sent as base64 or URL

    if (!image) {
      throw new BadRequestError('Image is required for data extraction');
    }

    const extractedData = await extractStudentDataFromImage(image);

    return formatResponse(
      res,
      StatusCodes.OK,
      extractedData,
      'Student data extracted successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const studentSignUp = async (req, res, next) => {
  try {
    const { email, password, matricNumber, name, programme, level } = req.body;

    validateRequiredFields(
      ['email', 'password', 'matricNumber', 'name', 'programme', 'level'],
      req.body
    );

    const existingUser = await User.findOne({
      $or: [{ email }, { matricNumber }],
    }).lean();
    if (existingUser) {
      throw new BadRequestError('Email or matric number already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      matricNumber,
      name,
      programme,
      level,
      role: 'student',
    });

    const verificationToken = generateToken(user);
    await sendVerificationEmail(user, verificationToken);

    return formatResponse(
      res,
      StatusCodes.CREATED,
      {
        id: user._id,
        email: user.email,
        matricNumber: user.matricNumber,
        name: user.name,
        role: user.role,
      },
      'Student account created. Please verify your email.'
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    validateRequiredFields(['email', 'password'], req.body);

    const user = await User.findOne({ email })
      .select('password role email name matricNumber')
      .lean();
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError('Invalid credentials');
    }

    const token = generateToken(user);

    return formatResponse(
      res,
      StatusCodes.OK,
      {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        matricNumber: user.matricNumber,
        token,
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // Since JWT is stateless, logout is typically handled client-side by removing the token
    // Server can optionally invalidate token by maintaining a blacklist (not implemented here)
    return formatResponse(res, StatusCodes.OK, {}, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

export const lecturerSignUp = async (req, res, next) => {
  try {
    const { email, password, name, department, faculty } = req.body;

    validateRequiredFields(
      ['email', 'password', 'name', 'department', 'faculty'],
      req.body
    );

    const existingUser = await User.findOne({ email, role: 'lecturer' }).lean();
    if (!existingUser) {
      throw new NotFoundError('Lecturer email not found in seeded data');
    }

    if (existingUser.password) {
      throw new BadRequestError('Lecturer account already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await User.findOneAndUpdate(
      { email, role: 'lecturer' },
      { password: hashedPassword, name, department, faculty },
      { new: true, select: 'email name role department faculty' }
    );

    const verificationToken = generateToken(updatedUser);
    await sendVerificationEmail(updatedUser, verificationToken);

    return formatResponse(
      res,
      StatusCodes.OK,
      {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        department: updatedUser.department,
        faculty: updatedUser.faculty,
      },
      'Lecturer account updated. Please verify your email.'
    );
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      throw new BadRequestError('Verification token is required');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    const user = await User.findById(decoded.id).select('isEmailVerified');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestError('Email already verified');
    }

    user.isEmailVerified = true;
    await user.save();

    return formatResponse(
      res,
      StatusCodes.OK,
      {},
      'Email verified successfully'
    );
  } catch (error) {
    next(error);
  }
};
