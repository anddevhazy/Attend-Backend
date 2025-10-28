import { StatusCodes } from 'http-status-codes';
import CustomAPIError from './CustomApiError.js';

// 403 - Authenticated but not authorized (insufficient permissions)
class UnauthorizedError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.FORBIDDEN; // 403
  }
}

export default UnauthorizedError;
