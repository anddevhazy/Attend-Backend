import { StatusCodes } from 'http-status-codes';
import {
  BadRequestError,
  NotFoundError,
  InternalServerError,
} from '../errors/index.js';
import formatResponse from '../utils/formatResponse.js';
import validateRequiredFields from '../utils/validateRequiredFields.js';
import User from '../models/user.model.js';
import JobResult from '../models/jobResult.model.js';
import PendingLecturerUpdate from '../models/pendingLecturerUpdate.model.js';
import mongoose from 'mongoose';
import redis, { createQueue } from '../queues/redis.js';

export const studentSignUp = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    validateRequiredFields(
      ['email', 'password', 'matricNumber', 'name', 'programme', 'level'],
      req.body
    );

    const user = await User.create({
      email,
      password,
      role: 'student',
    });

    const verificationToken = user.generateToken();

    const sendVerificationEmailQueue = createQueue('send-verification-email');
    await sendVerificationEmailQueue.add(
      'send-verification-email-student-job',
      {
        user: { email, _id: user._id },
        verificationToken,
      }
    );

    return formatResponse(
      res,
      StatusCodes.CREATED,
      {
        id: user._id,
        email: user.email,
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

    const verificationToken = user.generateToken();
    await PendingLecturerUpdate.create({
      userId: user._id,
      email,
      password,
      name,
      department,
      faculty,
      verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

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
      { id: user._id, email: user.email },
      'Verification email queued. Please verify to update lecturer details.'
    );
  } catch (error) {
    console.error('LECTURER SIGNUP ERROR:', error);
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

    const user = await User.findById(decoded.id).select(
      'isEmailVerified isActivated'
    );
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestError('Email already verified');
    }

    user.isEmailVerified = true;

    const pendingUpdate = await PendingLecturerUpdate.findOne({
      userId: user._id,
    });
    if (pendingUpdate && user.role === 'lecturer') {
      user.password = pendingUpdate.password;
      user.name = pendingUpdate.name;
      user.department = pendingUpdate.department;
      user.faculty = pendingUpdate.faculty;
      await pendingUpdate.deleteOne();
    }
    await user.save();

    return formatResponse(
      res,
      StatusCodes.OK,
      { id: user._id, email: user.email, isActivated: user.isActivated },
      'Email verified successfully. Please activate your account in-app'
    );
  } catch (error) {
    next(error);
  }
};

export const updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    validateRequiredFields(['fcmToken'], req.body);

    await User.findByIdAndUpdate(req.user.id, { fcmToken }, { new: true });

    return formatResponse(
      res,
      StatusCodes.OK,
      {},
      'FCM token updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const checkActivateAccountStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const jobResult = await JobResult.findOne({ jobId }).lean();
    if (!jobResult) {
      throw new NotFoundError('Job not found');
    }

    return formatResponse(res, StatusCodes.OK, {
      jobId: jobResult.jobId,
      status: jobResult.status,
      result: jobResult.result,
      error: jobResult.error,
    });
  } catch (error) {
    next(error);
  }
};

export const activateAccount = async (req, res, next) => {
  try {
    const { image } = req.body;
    if (!image) {
      throw new BadRequestError('Image is required for account activation');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestError('Email must be verified before activation');
    }

    if (user.isActivated) {
      throw new BadRequestError('Account already activated');
    }

    const extractDataQueue = createQueue('extract-data');
    try {
      // Check Redis connection before adding the job
      await redis.ping();

      const job = await extractDataQueue.add('extract-data-job', {
        image,
        userId: req.user.id,
      });

      return formatResponse(
        res,
        StatusCodes.ACCEPTED,
        { jobId: job.id },
        'Image processing started for account activation. Check job status.'
      );
    } catch (error) {
      console.error('Redis queue error:', error);
      throw new InternalServerError('Failed to queue image processing');
    }
  } catch (error) {
    next(error);
  }
};
