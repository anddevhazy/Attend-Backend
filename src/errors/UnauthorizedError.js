import { StatusCodes } from 'http-status-codes';
import CustomApiError from './CustomApiError.js';

class UnauthorizedError extends CustomApiError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

export default UnauthorizedError;
