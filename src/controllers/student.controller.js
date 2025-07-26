import Sessions from '../models/attendanceSession.model.js';
import User from '../models/user.model.js';
import OverrideRequest from '../models/overrideRequest.model.js';
import Course from '../models/course.model.js';
// eslint-disable-next-line no-unused-vars
import Location from '../models/location.model.js';

export const getDashboard = async (req, res) => {
  try {
    const { chosenCourses } = req.query;

    let courseFilter = {};
    if (chosenCourses) {
      const idOfChosenCourses = chosenCourses.split(',');
      courseFilter = { courseId: { $in: idOfChosenCourses } };
    }

    const activeSession = await Sessions.find({
      ...courseFilter,
      status: 'active',
      // startTime: { $lte: new Date() },
      endTime: { $gt: new Date() },
    })
      .populate('courseId', 'name')
      .populate('lecturerId', 'name')
      .populate('locationId', 'name');

    const timeRemainingAndAttendeesCount = activeSession.map((session) => ({
      ...session.toObject(),
      timeRemaining: Math.max(
        0,
        Math.floor((session.endTime - new Date()) / (1000 * 60))
      ),
      attendeeCount: session.attendees.length,
    }));

    res.status(200).json({
      success: true,
      data: {
        activeSession: timeRemainingAndAttendeesCount,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message,
    });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { sessionId, deviceId, selfie, latitude, longitude, matricNumber } =
      req.body;

    if (
      !sessionId ||
      !deviceId ||
      !selfie ||
      !latitude ||
      !longitude ||
      !matricNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: sessionId, deviceId, selfie, latitude, longitude, matricNumber',
      });
    }

    const session = await Sessions.findById(sessionId)
      .populate('locationId')
      .populate('courseId', 'name');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.status !== 'active' || new Date() > session.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Session has ended or is not active',
      });
    }

    const hasAlreadyMarked = session.attendees.some(
      (attendee) => attendee.matricNumber === matricNumber
    );

    if (hasAlreadyMarked) {
      return res.status(400).json({
        success: false,
        message:
          'Attendance already marked for this session with this matric number',
      });
    }

    const location = session.locationId;
    const isWithinGeofence = checkGeofence(
      latitude,
      longitude,
      location.corners
    );

    if (!isWithinGeofence) {
      return res.status(400).json({
        success: false,
        message: 'You are not within the required location for this class',
      });
    }

    const deviceCheck = await handleDeviceValidation(matricNumber, deviceId);

    if (!deviceCheck.success) {
      return res.status(400).json({
        success: false,
        message: deviceCheck.message,
        requiresOverride: true,
        conflictInfo: deviceCheck.conflictInfo,
      });
    }

    const user = await User.findOne({ matricNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this matric number',
      });
    }

    session.attendees.push({
      studentId: user._id,
      matricNumber,
      selfie,
      deviceIdUsed: deviceId,
      timestamp: new Date(),
    });

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        sessionName: session.courseId.name,
        timestamp: new Date(),
        attendeeCount: session.attendees.length,
      },
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message,
    });
  }
};

function checkGeofence(latitude, longitude, corners) {
  let inside = false;

  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    if (
      corners[i].latitude > latitude !== corners[j].latitude > latitude &&
      longitude <
        ((corners[j].longitude - corners[i].longitude) *
          (latitude - corners[i].latitude)) /
          (corners[j].latitude - corners[i].latitude) +
          corners[i].longitude
    ) {
      inside = !inside;
    }
  }

  return inside;
}

async function handleDeviceValidation(matricNumber, deviceId) {
  try {
    const deviceOwner = await User.findOne({ deviceId });

    if (!deviceOwner) {
      await User.updateOne({ matricNumber }, { deviceId });
      return { success: true };
    }

    if (deviceOwner.matricNumber === matricNumber) {
      return { success: true };
    }

    return {
      success: false,
      message: 'This device is already tied to another student account',
      conflictInfo: {
        matricNumber: deviceOwner.matricNumber,
        name: deviceOwner.name,
      },
    };
  } catch (error) {
    console.error('Device validation error:', error);
    return {
      success: false,
      message: 'Error validating device',
    };
  }
}

export const requestOverride = async (req, res) => {
  try {
    const { sessionId, selfie, deviceId, matricNumber } = req.body;

    if (!sessionId || !selfie || !deviceId || !matricNumber) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: sessionId, selfie, deviceId, matricNumber, ',
      });
    }

    const session = await Sessions.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.status !== 'active' || new Date() > session.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Session has ended, cannot request override',
      });
    }

    const originalOwner = await fetchOriginalOwner(deviceId);

    const existingRequest = await OverrideRequest.findOne({
      sessionId,
      matricNumber,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Override request already submitted for this session',
      });
    }
    const user = await User.findOne({ matricNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this matric number',
      });
    }

    const overrideRequest = new OverrideRequest({
      studentId: user._id,
      sessionId,
      matricNumber,
      selfie,
      originalOwnerMatric: originalOwner.conflictInfo.matricNumber,
      originalOwnerSelfie: originalOwner.conflictInfo.selfie,
      lecturerId: session.lecturerId,
    });

    await overrideRequest.save();

    res.status(201).json({
      success: true,
      message:
        'Override request submitted successfully. Waiting for lecturer approval.',
      data: {
        overrideRequestId: overrideRequest._id,
        realOwner: originalOwner.conflictInfo.matricNumber,
      },
    });
  } catch (error) {
    console.error('Request override error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting override request',
      error: error.message,
    });
  }
};

async function fetchOriginalOwner(deviceId) {
  try {
    const deviceOwner = await User.findOne({ deviceId });

    return {
      conflictInfo: {
        matricNumber: deviceOwner.matricNumber,
        name: deviceOwner.name,
        selfie: deviceOwner.selfie,
      },
    };
  } catch (error) {
    console.error('Error Fetching Original device owner', error);
    return {
      success: false,
      message: 'Error Fetching Original device owner',
    };
  }
}

export const selectCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: {
        courses,
        totalCourses: courses.length,
      },
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message,
    });
  }
};

export const enrollInCourses = async (req, res) => {
  try {
    const { studentId, courseIds } = req.body;

    if (!studentId || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'studentId and courseIds array are required',
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    student.selectedCourses = courseIds;
    await student.save();

    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $addToSet: { students: student._id } }
    );

    res.status(200).json({
      success: true,
      message: 'Courses successfully selected',
      data: {
        selectedCourses: student.selectedCourses,
      },
    });
  } catch (error) {
    console.error('Enroll in courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in courses',
      error: error.message,
    });
  }
};
