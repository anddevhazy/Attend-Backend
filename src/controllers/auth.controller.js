/* eslint-disable no-unused-vars */
import { StatusCodes } from 'http-status-codes';
import { NotFoundError } from '../errors/index.js';
import formatResponseUtil from '../utils/global/format_response_util.js';
import validateRequiredFieldsUtil from '../utils/global/validate_required_fields_util.js';
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

    return formatResponseUtil(res, StatusCodes.OK, 'Lecturer Found');
  } catch (error) {
    console.error('LECTURER Not Found:', error);
    next(error);
  }
};
