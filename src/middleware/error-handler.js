import { StatusCodes } from 'http-status-codes';
import { CustomAPIError } from '../errors/index.js';

// eslint-disable-next-line no-unused-vars
const errorHandlerMiddleware = (err, req, res, next) => {
  // If it's a custom error (one of your own), use its status code and message
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Otherwise, it's an unexpected error — send a generic 500 response
  console.error('Unhandled Error:', err);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: 'Something went wrong. Please try again later.',
  });
};

export default errorHandlerMiddleware;
