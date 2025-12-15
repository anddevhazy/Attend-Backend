import { CustomApiError } from '../errors/index.js';
import { StatusCodes } from 'http-status-codes';

// eslint-disable-next-line no-unused-vars
const errorHandlerMiddleware = (err, req, res, next) => {
  console.error('😭 ERROR HANDLER CAUGHT:', err);

  if (err instanceof CustomApiError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }

  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: err.message, stack: err.stack });
};

export default errorHandlerMiddleware;
