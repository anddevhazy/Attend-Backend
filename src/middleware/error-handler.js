import { CustomAPIError } from '../errors/index.js';
import { StatusCodes } from 'http-status-codes';
// eslint-disable-next-line no-unused-vars
const errorHandlerMiddleware = (err, req, res, next) => {
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ msg: err.message });
  }
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
};
export default errorHandlerMiddleware;
