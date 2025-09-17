// I should use asyncHandler util in my next project

// That big chunk of try { ... } catch (error) { next(error) } is exactly what asyncHandler saves you from writing over and over in each controller.

import { StatusCodes } from 'http-status-codes';
import {
  BadRequestError,
  NotFoundError,
  InternalServerError,
} from '../errors/index.js';
import formatResponse from '../utils/formatResponse.js';
import validateRequiredFields from '../utils/validateRequiredFields.js';
import {
  checkGeofence,
  handleDeviceValidation,
  fetchOriginalOwner,
} from '../utils/attendanceUtils.js';
import Session from '../models/attendanceSession.model.js';
import User from '../models/user.model.js';
import OverrideRequest from '../models/overrideRequest.model.js';
import Course from '../models/course.model.js';

export const getDashboard = async (req, res, next) => {
  try {
    const { chosenCourses } = req.query;

    let courseFilter = {};
    if (chosenCourses) {
      const idOfChosenCourses = chosenCourses.split(',');
      courseFilter = { courseId: { $in: idOfChosenCourses } };
    }

    const activeSessions = await Session.find({
      ...courseFilter,
      status: 'active',
      endTime: { $gt: new Date() },
    })
      .select('courseId lecturerId locationId attendees endTime')
      .populate('courseId', 'name')
      .populate('lecturerId', 'name')
      .populate('locationId', 'name')
      .lean();

    const sessionsData = activeSessions.map((session) => ({
      id: session._id,
      courseName: session.courseId?.name,
      lecturerName: session.lecturerId?.name,
      locationName: session.locationId?.name,
      timeRemaining: Math.max(
        0,
        Math.floor((session.endTime - new Date()) / (1000 * 60))
      ),
      attendeeCount: session.attendees.length,
    }));

    return formatResponse(res, StatusCodes.OK, {
      activeSessions: sessionsData,
    });
  } catch (error) {
    next(error);
  }
};

const isValidBase64Image = (selfie) => {
  const base64Regex = /^data:image\/(jpeg|png|jpg);base64,[A-Za-z0-9+/=]+$/;
  return base64Regex.test(selfie);
};

export const markAttendance = async (req, res, next) => {
  try {
    const { sessionId, deviceId, selfie, latitude, longitude, matricNumber } =
      req.body;

    validateRequiredFields(
      [
        'sessionId',
        'deviceId',
        'selfie',
        'latitude',
        'longitude',
        'matricNumber',
      ],
      req.body
    );

    if (!isValidBase64Image(selfie)) {
      throw new BadRequestError(
        'Invalid selfie format: must be a base64-encoded image'
      );
    }

    const session = await Session.findById(sessionId)
      .select('status endTime attendees locationId courseId')
      .populate('locationId', 'corners')
      .populate('courseId', 'name')
      .exec();

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.status !== 'active' || new Date() > session.endTime) {
      throw new BadRequestError('Session has ended or is not active');
    }

    const hasAlreadyMarked = session.attendees.some(
      (attendee) => attendee.matricNumber === matricNumber
    );

    if (hasAlreadyMarked) {
      throw new BadRequestError(
        'Attendance already marked for this session with this matric number'
      );
    }

    const isWithinGeofence = checkGeofence(
      latitude,
      longitude,
      session.locationId.corners
    );
    if (!isWithinGeofence) {
      throw new BadRequestError(
        'You are not within the required location for this class'
      );
    }

    const deviceCheck = await handleDeviceValidation(matricNumber, deviceId);
    if (!deviceCheck.success) {
      throw new BadRequestError(deviceCheck.message, {
        requiresOverride: true,
        conflictInfo: deviceCheck.conflictInfo,
      });
    }

    const user = await User.findOne({ matricNumber }).select('_id').lean();
    if (!user) {
      throw new NotFoundError('Student not found with this matric number');
    }

    session.attendees.push({
      studentId: user._id,
      matricNumber,
      selfie,
      deviceIdUsed: deviceId,
      timestamp: new Date(),
    });

    await session.save();

    return formatResponse(
      res,
      StatusCodes.OK,
      {
        sessionName: session.courseId.name,
        timestamp: new Date(),
        attendeeCount: session.attendees.length,
      },
      'Attendance marked successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const requestOverride = async (req, res, next) => {
  try {
    const { sessionId, selfie, deviceId, matricNumber } = req.body;

    validateRequiredFields(
      ['sessionId', 'selfie', 'deviceId', 'matricNumber'],
      req.body
    );

    const session = await Session.findById(sessionId)
      .select('status endTime lecturerId')
      .lean();
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.status !== 'active' || new Date() > session.endTime) {
      throw new BadRequestError('Session has ended, cannot request override');
    }

    const existingRequest = await OverrideRequest.findOne({
      sessionId,
      matricNumber,
      status: 'pending',
    }).lean();

    if (existingRequest) {
      throw new BadRequestError(
        'Override request already submitted for this session'
      );
    }

    const user = await User.findOne({ matricNumber }).select('_id').lean();
    if (!user) {
      throw new NotFoundError('Student not found with this matric number');
    }

    const originalOwner = await fetchOriginalOwner(deviceId);
    if (
      !originalOwner.success &&
      originalOwner.message === 'Error Fetching Original device owner'
    ) {
      throw new InternalServerError('Error fetching original device owner');
    }

    const overrideRequest = await OverrideRequest.create({
      studentId: user._id,
      sessionId,
      matricNumber,
      selfie,
      originalOwnerMatric: originalOwner.conflictInfo?.matricNumber,
      originalOwnerSelfie: originalOwner.conflictInfo?.selfie,
      lecturerId: session.lecturerId,
    });

    return formatResponse(
      res,
      StatusCodes.CREATED,
      {
        overrideRequestId: overrideRequest._id,
        realOwner: originalOwner.conflictInfo?.matricNumber,
      },
      'Override request submitted successfully. Waiting for lecturer approval.'
    );
  } catch (error) {
    next(error);
  }
};

export const selectCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({})
      .select('name _id')
      .sort({ name: 1 })
      .lean();

    return formatResponse(res, StatusCodes.OK, {
      courses,
      totalCourses: courses.length,
    });
  } catch (error) {
    next(error);
  }
};

export const enrollInCourses = async (req, res, next) => {
  try {
    const { studentId, courseIds } = req.body;

    validateRequiredFields(['studentId'], req.body);
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      throw new BadRequestError('courseIds must be a non-empty array');
    }

    const student = await User.findById(studentId).select('selectedCourses');
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    student.selectedCourses = courseIds;
    await student.save();

    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $addToSet: { students: student._id } }
    );

    return formatResponse(
      res,
      StatusCodes.OK,
      {
        selectedCourses: student.selectedCourses,
      },
      'Courses successfully selected'
    );
  } catch (error) {
    next(error);
  }
};
