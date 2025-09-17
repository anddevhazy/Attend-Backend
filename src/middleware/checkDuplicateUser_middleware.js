import { BadRequestError } from '../errors/index.js';
import User from '../models/user.model.js';

export const checkDuplicateUser = async (req, res, next) => {
  try {
    const { email, matricNumber, role } = req.body;
    const existingUser = await User.findOne({
      $or: [{ email }, { matricNumber }],
    }).lean();

    if (existingUser) {
      throw new BadRequestError(
        `${role === 'lecturer' ? 'Lecturer email' : 'Email or matric number'} already in use`
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};
