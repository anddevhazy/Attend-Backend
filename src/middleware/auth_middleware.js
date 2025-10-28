import jwt from 'jsonwebtoken';
import { UnauthenticatedError } from '../errors/index.js';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthenticatedError('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach decoded user info to the request
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    throw new UnauthenticatedError('Invalid or expired token');
  }
};

export default authMiddleware;
