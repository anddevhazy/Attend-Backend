import User from '../models/User.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, UnauthenticatedError } from '../errors/index.js';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG) and PDF files are allowed'));
    }
  },
});

// Helper function to extract student data from OCR text
const extractStudentData = (ocrText, expectedLevel) => {
  const text = ocrText.toUpperCase();

  // Patterns for different data extraction
  const matricPattern =
    /(?:MATRIC(?:\s+NO)?|REG(?:\s+NO)?)[:\s]*([A-Z0-9\/]+)/i;
  const namePattern = /(?:NAME|STUDENT\s+NAME)[:\s]*([A-Z\s]+)(?:\n|$)/i;
  const coursePattern =
    /(?:COURSE|PROGRAMME|DEPARTMENT)[:\s]*([A-Z\s&\/]+)(?:\n|LEVEL|YEAR)/i;
  const levelPattern = /(?:LEVEL|YEAR)[:\s]*(\d{3}L?)/i;

  // Extract data using regex
  const matricMatch = text.match(matricPattern);
  const nameMatch = text.match(namePattern);
  const courseMatch = text.match(coursePattern);
  const levelMatch = text.match(levelPattern);

  return {
    matricNumber: matricMatch ? matricMatch[1].trim() : null,
    studentName: nameMatch ? nameMatch[1].trim() : null,
    course: courseMatch ? courseMatch[1].trim() : null,
    level: levelMatch ? levelMatch[1].replace('L', '') + 'L' : null,
    extractedText: text, // Keep full text for debugging
  };
};

// Middleware to handle file upload
export const uploadDocument = upload.single('document');

// Step 1: Upload and scan document
export const uploadAndScanDocument = async (req, res) => {
  try {
    if (!req.file) {
      throw new BadRequestError(
        'Please upload a document (course form or result)'
      );
    }

    const { expectedLevel } = req.body;

    if (
      !expectedLevel ||
      !['100L', '200L', '300L', '400L', '500L', '600L'].includes(expectedLevel)
    ) {
      throw new BadRequestError(
        'Please specify your current level (100L-600L)'
      );
    }

    // Perform OCR on uploaded image
    const imagePath = req.file.path;

    try {
      const {
        data: { text },
      } = await Tesseract.recognize(imagePath, 'eng', {
        logger: (m) => console.log(m),
      });

      // Extract student data from OCR text
      const extractedData = extractStudentData(text, expectedLevel);

      // Validate extracted data
      if (!extractedData.matricNumber) {
        throw new BadRequestError(
          'Could not extract matric number from document. Please ensure the document is clear and readable.'
        );
      }

      if (!extractedData.studentName) {
        throw new BadRequestError(
          'Could not extract student name from document. Please ensure the document is clear and readable.'
        );
      }

      // For 100L students, we need course info from course form
      if (expectedLevel === '100L' && !extractedData.course) {
        throw new BadRequestError(
          'Could not extract course information from course form. Please ensure the document is clear and readable.'
        );
      }

      // For 200L-600L students, validate it's a result document
      if (expectedLevel !== '100L') {
        const hasGrades =
          /(?:A|B|C|D|E|F)(?:\+|\-)?|(?:\d+\.\d+)|(?:PASS|FAIL)/i.test(text);
        if (!hasGrades) {
          throw new BadRequestError(
            'This does not appear to be a valid result document. Please upload your previous semester result.'
          );
        }
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        matricNumber: extractedData.matricNumber,
      });
      if (existingUser) {
        throw new BadRequestError(
          'A user with this matric number already exists'
        );
      }

      // Clean up uploaded file after processing
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });

      // Return extracted data for frontend to display and confirm
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Document scanned successfully',
        data: {
          matricNumber: extractedData.matricNumber,
          studentName: extractedData.studentName,
          course: extractedData.course,
          level: expectedLevel,
          // Don't send the full extracted text to frontend for security
        },
      });
    } catch (ocrError) {
      // Clean up file if OCR fails
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      throw new BadRequestError(
        'Failed to process document. Please ensure the image is clear and readable.'
      );
    }
  } catch (error) {
    throw error;
  }
};

// Step 2: Complete registration with email and password
export const completeRegistration = async (req, res) => {
  try {
    const {
      matricNumber,
      studentName,
      course,
      level,
      email,
      password,
      confirmPassword,
    } = req.body;

    // Validate required fields
    if (!matricNumber || !studentName || !level || !email || !password) {
      throw new BadRequestError('Please provide all required fields');
    }

    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }

    if (password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters long');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestError('Please provide a valid email address');
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new BadRequestError('Email already exists');
    }

    // Check if matric number already exists (double check)
    const existingMatric = await User.findOne({ matricNumber });
    if (existingMatric) {
      throw new BadRequestError('Matric number already exists');
    }

    // For 100L students, course is required
    if (level === '100L' && !course) {
      throw new BadRequestError(
        'Course information is required for 100L students'
      );
    }

    // Create user
    const userData = {
      matricNumber,
      name: studentName,
      email,
      password,
      level,
      course: course || null,
      registrationDate: new Date(),
      isVerified: false, // You might want to add email verification later
    };

    const user = await User.create(userData);

    // Create JWT token
    const token = user.createJWT();

    // Remove password from response
    const userResponse = {
      id: user._id,
      matricNumber: user.matricNumber,
      name: user.name,
      email: user.email,
      level: user.level,
      course: user.course,
    };

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Registration completed successfully',
      user: userResponse,
      token,
    });
  } catch (error) {
    throw error;
  }
};

// Regular login function (same as before)
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const token = user.createJWT();

  const userResponse = {
    id: user._id,
    matricNumber: user.matricNumber,
    name: user.name,
    email: user.email,
    level: user.level,
    course: user.course,
  };

  res.status(StatusCodes.OK).json({
    success: true,
    user: userResponse,
    token,
  });
};
