import { StatusCodes } from 'http-status-codes';
import CustomAPIError from './CustomApiError.js';

// 401 - Authentication failed (invalid credentials, no token, expired token)
class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED; // 401
  }
}

export default UnauthenticatedError;
