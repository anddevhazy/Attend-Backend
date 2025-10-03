import { StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError } from '../errors/index.js';
import formatResponse from '../utils/formatResponse.js';
import validateRequiredFields from '../utils/validateRequiredFields.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import { createQueue } from '../queues/redis.js';

export const studentExtractData = async (req, res, next) => {
  try {
    const { image } = req.body;
    if (!image) {
      throw new BadRequestError('Image is required for data extraction');
    }
    const extractDataQueue = createQueue('extract-data');
    const job = await extractDataQueue.add('extract-data-job', {
      image,
      userId: req.user?.id || 'anonymous', // Optional: Track user
    });

    return formatResponse(
      res,
      StatusCodes.ACCEPTED,
      { jobId: job.id },
      'Image processing started. Check job status for results'
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

    const user = await User.create({
      email,
      password,
      matricNumber,
      name,
      programme,
      level,
      role: 'student',
    });

    const verificationToken = user.generateToken();

    const sendVerificationEmailQueue = createQueue('send-verification-email');
    await sendVerificationEmailQueue.add(
      'send-verification-email-student-job',
      {
        user: { email, name, _id: user._id },
        verificationToken,
      }
    );

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
      'Student account created. Verification email queued.'
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    validateRequiredFields(['email', 'password'], req.body);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new BadRequestError('Invalid credentials');
    }

    const token = user.generateToken();

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

    const user = await User.findOne({ email, role: 'lecturer' });
    if (!user) {
      throw new NotFoundError('Lecturer not found');
    }

    user.password = password;
    user.name = name;
    user.department = department;
    user.faculty = faculty;

    await user.save();

    const verificationToken = user.generateToken();

    const sendVerificationEmailQueue = createQueue('send-verification-email');
    await sendVerificationEmailQueue.add(
      'send-verification-email-lecturer-job',
      {
        user: { email, name, _id: user._id },
        verificationToken,
      }
    );

    return formatResponse(
      res,
      StatusCodes.OK,
      {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        faculty: user.faculty,
      },
      'Lecturer account updated. Verification email queued.'
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

    const decoded = User.verifyEmailToken(token);
    if (!decoded || !decoded.id || !mongoose.isValidObjectId(decoded.id)) {
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
