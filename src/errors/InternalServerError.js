import { StatusCodes } from 'http-status-codes';
import CustomApiError from './CustomApiError.js';

class InternalServerError extends CustomApiError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }
}

export default InternalServerError;
