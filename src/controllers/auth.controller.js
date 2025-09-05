import { StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError } from '../errors/index.js';
import formatResponse from '../utils/formatResponse.js';
import validateRequiredFields from '../utils/validateRequiredFields.js';
import extractStudentDataFromImage from '../utils/extractStudentDataFromImage.js';
import generateToken from '../utils/generateToken.js';
import sendVerificationEmail from '../utils/sendVerificationEmail.js';
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const studentExtractData = async (req, res, next) => {
  try {
    const { image } = req.body;
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
