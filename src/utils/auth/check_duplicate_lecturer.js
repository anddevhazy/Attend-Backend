import Lecturer from '../models/lecturer_model.js';
import { BadRequestError } from '../errors/index.js';

export const checkDuplicateLecturer = async (email) => {
  const existing = await Lecturer.findOne({ email, role: 'lecturer' }).lean();
  if (existing) {
    throw new BadRequestError('Lecturer email already in use');
  }
};
