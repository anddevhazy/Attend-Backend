import { StatusCodes } from 'http-status-codes';

class CustomApiError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR; // Default status code
  }
}

export default CustomApiError;
