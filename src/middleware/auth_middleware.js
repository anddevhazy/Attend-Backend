import jwt from 'jsonwebtoken';
// eslint-disable-next-line no-unused-vars
import { BadRequestError, UnauthorizedError } from '../errors/index.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};
