/* eslint-disable no-unused-vars */
import { StatusCodes } from 'http-status-codes';
import { NotFoundError } from '../errors/index.js';
import formatResponse from '../utils/formatResponse.js';
import validateRequiredFieldsUtil from '../utils/validate_required_fields_util.js';
import Lecturer from '../models/lecturer_model.js';

export const lecturerSignUp = async (req, res, next) => {
  try {
    const { email, password, name, department, faculty } = req.body;

    validateRequiredFieldsUtil(
      ['email', 'password', 'name', 'department', 'faculty'],
      req.body
    );

    const lecturer = await Lecturer.findOne({ email, role: 'lecturer' });
    if (!lecturer) {
      throw new NotFoundError('Lecturer not found');
    }

    return formatResponse(res, StatusCodes.OK, 'Lecturer Found');
  } catch (error) {
    console.error('LECTURER Not Found:', error);
    next(error);
  }
};
