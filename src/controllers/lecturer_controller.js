import { StatusCodes } from 'http-status-codes';
import Session from '../models/attendance_session_model.js';
import formatResponse from '../utils/formatResponse.js';
import validateRequiredFieldsUtil from '../utils/validate_required_fields_util.js';

export const createSession = async (req, res, next) => {
  try {
    const { courseId, lecturerId, locationId, startTime, endTime } = req.body;

    validateRequiredFieldsUtil(
      ['courseId', 'lecturerId', 'locationId', 'startTime', 'endTime'],
      req.body
    );

    const session = await Session.create({
      courseId,
      lecturerId,
      locationId,
      startTime,
      endTime,
    });

    return formatResponse(
      res,
      StatusCodes.CREATED,
      {
        id: session._id,
        courseId: session.courseId,
        lecturerId: session.lecturerId,
        locationId: session.locationId,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        createdAt: session.createdAt,
      },
      'Session created successfully'
    );
  } catch (error) {
    next(error);
  }
};
