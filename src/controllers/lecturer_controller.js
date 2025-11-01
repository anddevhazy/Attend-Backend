import { StatusCodes } from 'http-status-codes';
import Session from '../models/attendance_session_model.js';
import validateRequiredFieldsUtil from '../utils/global/validate_required_fields_util.js';
import {
  BadRequestError,
  NotFoundError,
  // UnauthenticatedError,
  // InternalServerError,
} from '../errors/index.js';
import formatResponseUtil from '../utils/global/format_response_util.js';
import OverrideRequest from '../models/override_request_model.js';

export const createSession = async (req, res, next) => {
  try {
    // Destructure required fields from the request body
    const { courseId, locationId, startTime, endTime } = req.body;

    // Validate that all necessary fields are present in the request body.
    validateRequiredFieldsUtil(
      ['courseId', 'locationId', 'startTime', 'endTime'],
      req.body
    );

    const lecturerId = req.user.id;

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

export const getOverrideRequests = async (req, res, next) => {
  try {
    // 1. Extract the session ID from request parameters
    const { sessionId } = req.params;

    // 2. Validate that the sessionId is provided
    if (!sessionId) {
      throw new BadRequestError('Session ID is required');
    }

    const lecturerId = req.user.id;

    // 3. Query the database for override requests associated with the session ID.
    const overrideRequests = await OverrideRequest.find({
      sessionId,
      lecturerId,
    })
      // Select specific fields for a lighter response payload
      .select(
        'studentId lecturerId status createdAt decisionTimestamp selfie originalOwnerMatric originalOwnerSelfie'
      )
      // Populate the studentId field to include student's name and matricNumber
      .populate('studentId', 'name matricNumber')
      // Convert the Mongoose documents to plain JavaScript objects for performance and simpler manipulation
      .lean();

    // 4. Check if any requests were found
    if (!overrideRequests.length) {
      // The NotFoundError covers two cases:
      // a) No requests exist for the sessionId.
      // b) Requests exist, but none are assigned to this specific lecturerId.
      throw new NotFoundError(
        'No override requests found for this session and lecturer'
      );
    }

    // 5. Respond with a successful status and the list of override requests
    return formatResponseUtil(res, StatusCodes.OK, { overrideRequests });
  } catch (error) {
    // 6. Pass any errors to the Express error handler middleware
    next(error);
  }
};

export const approveOverride = async (req, res, next) => {
  try {
    const { overrideRequestId } = req.body;

    validateRequiredFieldsUtil(['overrideRequestId'], req.body);

    // eslint-disable-next-line no-unused-vars
    const lecturerId = req.user.id;

    // 3. Find the override request by ID and populate related documents
    const overrideRequest = await OverrideRequest.findById(overrideRequestId)
      .populate('sessionId')
      .populate('studentId', 'matricNumber');
    // 4. Check if the override request exists
    if (!overrideRequest) {
      throw new NotFoundError('Override request not found');
    }

    // 5. Check if the request is still pending
    if (overrideRequest.status !== 'pending') {
      throw new BadRequestError(
        `Override request has already been ${overrideRequest.status}`
      );
    }

    const session = overrideRequest.sessionId;
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // 7. Update the override request status and decision details
    overrideRequest.status = 'approved';
    overrideRequest.decisionTimestamp = new Date();

    // 8. Add the student as an attendee to the session document
    session.attendees.push({
      studentId: overrideRequest.studentId._id,
      timestamp: overrideRequest.createdAt, // Use the time the request was created as attendance time
      matricNumber: overrideRequest.studentId.matricNumber,
      deviceIdUsed: overrideRequest.deviceIdUsed, // <--- Add this line
    });

    // 9. Save both the updated override request and the updated session document concurrently
    await Promise.all([overrideRequest.save(), session.save()]);

    // 10. Respond with success status and relevant details
    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        overrideRequest: {
          id: overrideRequest._id,
          status: overrideRequest.status,
          studentId: overrideRequest.studentId._id,
          sessionId: overrideRequest.sessionId,
          decisionTimestamp: overrideRequest.decisionTimestamp,
        },
        sessionId: session._id,
      },
      'Override request approved successfully'
    );
  } catch (error) {
    // 11. Pass any errors to the Express error handler middleware
    next(error);
  }
};

export const denyOverride = async (req, res, next) => {
  try {
    const { overrideRequestId } = req.body;

    validateRequiredFieldsUtil(['overrideRequestId'], req.body);

    // eslint-disable-next-line no-unused-vars
    const lecturerId = req.user.id;

    // 3. Find the override request by ID and populate related documents
    const overrideRequest = await OverrideRequest.findById(overrideRequestId)
      .populate('sessionId')
      .populate('studentId', 'matricNumber');
    // 4. Check if the override request exists
    if (!overrideRequest) {
      throw new NotFoundError('Override request not found');
    }

    // 5. Check if the request is still pending
    if (overrideRequest.status !== 'pending') {
      throw new BadRequestError(
        `Override request has already been ${overrideRequest.status}`
      );
    }

    // 7. Update the override request status and decision details
    overrideRequest.status = 'denied';
    overrideRequest.decisionTimestamp = new Date();

    await overrideRequest.save();

    // 10. Respond with success status and relevant details
    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        overrideRequest: {
          id: overrideRequest._id,
          status: overrideRequest.status,
          studentId: overrideRequest.studentId._id,
          sessionId: overrideRequest.sessionId,
          decisionTimestamp: overrideRequest.decisionTimestamp,
        },
      },
      'Override request denied successfully'
    );
  } catch (error) {
    // 11. Pass any errors to the Express error handler middleware
    next(error);
  }
};
