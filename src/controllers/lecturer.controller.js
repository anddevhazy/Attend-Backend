import { StatusCodes } from 'http-status-codes';
import Session from '../models/attendanceSession.model.js';
// eslint-disable-next-line no-unused-vars
import User from '../models/user.model.js';
import OverrideRequest from '../models/overrideRequest.model.js';
import {
  BadRequestError,
  NotFoundError,
  // eslint-disable-next-line no-unused-vars
  InternalServerError,
} from '../errors/index.js'; // Import from errors/index.js for convenience
import formatResponse from '../utils/formatResponse.js';
import validateRequiredFields from '../utils/validateRequiredFields.js';

export const createSession = async (req, res, next) => {
  try {
    const { courseId, lecturerId, locationId, startTime, endTime } = req.body;

    validateRequiredFields(
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

export const getLiveAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new BadRequestError('Session ID is required');
    }

    const session = await Session.findById(sessionId)
      .select('attendees status')
      .populate({
        path: 'attendees.studentId',
        select: 'name level matricNumber',
      })
      .lean();

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.status !== 'active') {
      throw new BadRequestError('Session is not active');
    }

    const attendees = session.attendees.map((att) => ({
      matricNumber: att.matricNumber,
      name: att.studentId.name,
      level: att.studentId.level,
      timestamp: att.timestamp,
    }));

    return formatResponse(res, StatusCodes.OK, { attendees });
  } catch (error) {
    next(error);
  }
};

export const getComparison = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new BadRequestError('Session ID is required');
    }

    const session = await Session.findById(sessionId)
      .select('attendees courseId')
      .populate({
        path: 'courseId',
        select: 'name students',
      })
      .lean();

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (!session.courseId) {
      throw new NotFoundError('Course not found');
    }

    const { courseId: course } = session;
    const totalRegistered = course.students.length;
    const totalMarked = session.attendees.length;

    return formatResponse(res, StatusCodes.OK, {
      courseName: course.name,
      totalRegistered,
      totalMarked,
      markedRatio: `${totalMarked}/${totalRegistered}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getOverrideRequests = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new BadRequestError('Session ID is required');
    }

    const overrideRequests = await OverrideRequest.find({ sessionId })
      .select('studentId lecturerId status createdAt decisionTimestamp')
      .populate('studentId', 'name matricNumber')
      .populate('lecturerId', 'name')
      .lean();

    if (!overrideRequests.length) {
      throw new NotFoundError('No override requests found for this session');
    }

    return formatResponse(res, StatusCodes.OK, { overrideRequests });
  } catch (error) {
    next(error);
  }
};

export const approveOverride = async (req, res, next) => {
  try {
    const { overrideRequestId } = req.params;
    const { lecturerId } = req.body;

    validateRequiredFields(['lecturerId'], req.body);

    const overrideRequest = await OverrideRequest.findById(overrideRequestId)
      .populate('studentId', 'matricNumber deviceId')
      .populate('sessionId')
      .exec();

    if (!overrideRequest) {
      throw new NotFoundError('Override request not found');
    }

    if (overrideRequest.status !== 'pending') {
      throw new BadRequestError(
        `Override request has already been ${overrideRequest.status}`
      );
    }

    const session = overrideRequest.sessionId;
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    overrideRequest.status = 'approved';
    overrideRequest.lecturerId = lecturerId;
    overrideRequest.decisionTimestamp = new Date();

    session.attendees.push({
      studentId: overrideRequest.studentId._id,
      selfie: overrideRequest.selfie,
      timestamp: overrideRequest.createdAt,
      deviceIdUsed: overrideRequest.studentId.deviceId,
      matricNumber: overrideRequest.studentId.matricNumber,
    });

    await Promise.all([overrideRequest.save(), session.save()]);

    return formatResponse(
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
    next(error);
  }
};

export const denyOverride = async (req, res, next) => {
  try {
    const { overrideRequestId } = req.params;
    const { lecturerId } = req.body;

    validateRequiredFields(['lecturerId'], req.body);

    const overrideRequest = await OverrideRequest.findById(overrideRequestId);

    if (!overrideRequest) {
      throw new NotFoundError('Override request not found');
    }

    if (overrideRequest.status !== 'pending') {
      throw new BadRequestError(
        `Override request has already been ${overrideRequest.status}`
      );
    }

    overrideRequest.status = 'denied';
    overrideRequest.lecturerId = lecturerId;
    overrideRequest.decisionTimestamp = new Date();

    await overrideRequest.save();

    return formatResponse(
      res,
      StatusCodes.OK,
      {
        overrideRequest: {
          id: overrideRequest._id,
          status: overrideRequest.status,
          decisionTimestamp: overrideRequest.decisionTimestamp,
        },
      },
      'Override request denied successfully'
    );
  } catch (error) {
    next(error);
  }
};
