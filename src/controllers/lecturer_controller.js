import { StatusCodes } from 'http-status-codes';
import Session from '../models/attendance_session_model.js';
import formatResponseUtil from '../utils/global/format_response_util.js';
import validateRequiredFieldsUtil from '../utils/global/validate_required_fields_util.js';

export const createSession = async (req, res, next) => {
  try {
    // Destructure required fields from the request body
    const { courseId, lecturerId, locationId, startTime, endTime } = req.body;

    // Validate that all necessary fields are present in the request body.
    validateRequiredFieldsUtil(
      ['courseId', 'lecturerId', 'locationId', 'startTime', 'endTime'],
      req.body
    );

    // Create a new session record in the database using the Mongoose model
    const session = await Session.create({
      courseId,
      lecturerId,
      locationId,
      startTime,
      endTime,
    });

    // Send a success response back to the client
    return formatResponseUtil(
      res,
      StatusCodes.CREATED, // Use 201 status code for successful resource creation
      {
        // Return the newly created session details, ensuring specific fields are exposed
        id: session._id,
        courseId: session.courseId,
        lecturerId: session.lecturerId,
        locationId: session.locationId,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status, // Includes the initial status (e.g., 'pending' or 'active')
        createdAt: session.createdAt,
      },
      'Session created successfully' // Success message
    );
  } catch (error) {
    // Pass any errors (e.g., validation errors, database errors) to the Express error handler middleware
    next(error);
  }
};
