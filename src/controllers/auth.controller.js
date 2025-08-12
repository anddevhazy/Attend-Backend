import fs from 'fs';
import pdfParse from 'pdf-parse';
import User from '../models/User.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, UnauthenticatedError } from '../errors/index.js';

export const uploadDocument = async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('Please upload a PDF file');
  }

  // Read uploaded PDF from temp storage
  const readPDF = fs.readFileSync(req.file.path);

  // Parse PDF text
  const data = await pdfParse(readPDF);
  const text = data.text;

  // Simple example of extracting details (you'll need to adjust regex to your PDF format)
  const matricMatch = text.match(/Matric\s*Number[:\s]+(\S+)/i);
  const nameMatch = text.match(/Name[:\s]+([A-Za-z\s]+)/i);
  const courseMatch = text.match(/Course[:\s]+([A-Za-z\s]+)/i);
  const levelMatch = text.match(/Level[:\s]+(\d{3}L)/i);

  if (!matricMatch || !nameMatch || !courseMatch || !levelMatch) {
    throw new BadRequestError('Could not extract all required fields from PDF');
  }

  // Return parsed info so user can confirm before setting email/password
  res.status(StatusCodes.OK).json({
    matricNumber: matricMatch[1],
    name: nameMatch[1].trim(),
    course: courseMatch[1].trim(),
    level: levelMatch[1],
  });
};

// STEP 2: Confirm details & create account
export const register = async (req, res) => {
  const { matricNumber, name, course, level, email, password } = req.body;

  if (!matricNumber || !name || !course || !level || !email || !password) {
    throw new BadRequestError('All fields are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new BadRequestError('Email is already registered');
  }

  // Create new user
  const user = await User.create({
    matricNumber,
    name,
    course,
    level,
    email,
    password,
  });

  // Generate JWT token
  const token = user.createJWT();

  res.status(StatusCodes.CREATED).json({
    user: {
      name: user.name,
      level: user.level,
      matricNumber: user.matricNumber,
    },
    token,
  });
};
