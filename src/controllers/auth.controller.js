import User from '../models/user.model.js';
import Course from '../models/course.model.js';
import Sessions from '../models/attendanceSession.model.js';
import OverrideRequest from '../models/overrideRequest.model.js';
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
      endTime: { $gt: new Date() }
    })
    .populate('courseId', 'name')
    .populate('lecturerId', 'name')
    .populate('locationId', 'name');

    const sessionsWithTimeRemaining = activeSession.map(session => ({
      ...session.toObject(),
      timeRemaining: Math.max(0, Math.floor((session.endTime - new Date()) / (1000 * 60))), 
      attendeeCount: session.attendees.length
    }));

    res.status(200).json({
      success: true,
      data: {
        activeSessions: sessionsWithTimeRemaining,
        totalSessions: sessionsWithTimeRemaining.length
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// Mark attendance for a session (stateless)
export const markAttendance = async (req, res) => {
  try {
    const { 
      sessionId, 
      deviceId, 
      selfie, 
      latitude, 
      longitude,
      matricNumber, // Pass this in the request
      name // Pass this in the request
    } = req.body;

    // Validate required fields
    if (!sessionId || !deviceId || !selfie || !latitude || !longitude || !matricNumber || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sessionId, deviceId, selfie, latitude, longitude, matricNumber, name'
      });
    }

    // Find the session
    const session = await AttendanceSession.findById(sessionId)
      .populate('locationId')
      .populate('courseId', 'name');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session is still active
    if (session.status !== 'active' || new Date() > session.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Session has ended or is not active'
      });
    }

    // Check if this matric number has already marked attendance for this session
    const hasAlreadyMarked = session.attendees.some(
      attendee => attendee.matricNumber === matricNumber
    );

    if (hasAlreadyMarked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this session with this matric number'
      });
    }

    // GPS Geofence check
    const location = session.locationId;
    const isWithinGeofence = checkGeofence(latitude, longitude, location.corners);
    
    if (!isWithinGeofence) {
      return res.status(400).json({
        success: false,
        message: 'You are not within the required location for this class'
      });
    }

    // Device ID validation logic (stateless)
    const deviceCheck = await handleDeviceValidation(matricNumber, deviceId, sessionId);
    
    if (!deviceCheck.success) {
      // If device validation fails, don't mark attendance
      // Return info for potential override request
      return res.status(400).json({
        success: false,
        message: deviceCheck.message,
        requiresOverride: true,
        conflictInfo: deviceCheck.conflictInfo
      });
    }

    // Mark attendance
    session.attendees.push({
      matricNumber,
      name,
      selfie,
      deviceIdUsed: deviceId,
      timestamp: new Date()
    });

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        sessionName: session.courseId.name,
        timestamp: new Date(),
        attendeeCount: session.attendees.length
      }
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
};

// Request override when device validation fails (stateless)
export const requestOverride = async (req, res) => {
  try {
    const { sessionId, selfie, deviceId, matricNumber, name } = req.body;

    if (!sessionId || !selfie || !deviceId || !matricNumber || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sessionId, selfie, deviceId, matricNumber, name'
      });
    }

    // Find the session
    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session is still active
    if (session.status !== 'active' || new Date() > session.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Session has ended, cannot request override'
      });
    }

    // Find who currently uses this device (from previous attendance records)
    const conflictingAttendance = await findDeviceOwner(deviceId);
    
    if (!conflictingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'No device conflict found'
      });
    }

    // Check if override request already exists for this session and matric number
    const existingRequest = await OverrideRequest.findOne({
      sessionId,
      matricNumber,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Override request already submitted for this session'
      });
    }

    // Create override request
    const overrideRequest = new OverrideRequest({
      sessionId,
      matricNumber,
      name,
      selfie,
      originalOwnerMatric: conflictingAttendance.matricNumber,
      existingSelfie: conflictingAttendance.selfie,
      lecturerId: session.lecturerId
    });

    await overrideRequest.save();

    res.status(201).json({
      success: true,
      message: 'Override request submitted successfully. Waiting for lecturer approval.',
      data: {
        requestId: overrideRequest._id,
        conflictWith: conflictingAttendance.matricNumber
      }
    });

  } catch (error) {
    console.error('Request override error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting override request',
      error: error.message
    });
  }
};

// Get attendance history for a matric number (stateless)
exports.getProfile = async (req, res) => {
  try {
    const { matricNumber } = req.query;

    if (!matricNumber) {
      return res.status(400).json({
        success: false,
        message: 'Matric number is required'
      });
    }

    // Get all sessions where this matric number attended
    const attendedSessions = await AttendanceSession.find({
      'attendees.matricNumber': matricNumber
    })
    .populate('courseId', 'name')
    .sort({ startTime: -1 });

    // Get all override requests for this matric number
    const overrideRequests = await OverrideRequest.find({
      matricNumber
    })
    .populate('sessionId')
    .sort({ createdAt: -1 });

    // Format attendance history
    const attendanceHistory = attendedSessions.map(session => {
      const attendance = session.attendees.find(
        attendee => attendee.matricNumber === matricNumber
      );
      
      return {
        sessionId: session._id,
        courseName: session.courseId.name,
        date: session.startTime,
        timestamp: attendance.timestamp,
        status: 'present'
      };
    });

    // Format override history
    const overrideHistory = overrideRequests.map(request => ({
      requestId: request._id,
      sessionId: request.sessionId._id,
      status: request.status,
      createdAt: request.createdAt,
      decisionTimestamp: request.decisionTimestamp
    }));

    res.status(200).json({
      success: true,
      data: {
        matricNumber,
        attendanceHistory,
        overrideHistory,
        summary: {
          totalPresent: attendanceHistory.length,
          totalOverrideRequests: overrideHistory.length,
          pendingOverrides: overrideHistory.filter(req => req.status === 'pending').length
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile data',
      error: error.message
    });
  }
};

// Get all available courses (stateless)
exports.selectCourses = async (req, res) => {
  try {
    // Simply return all available courses - no need to "select" for anyone
    const courses = await Course.find({}).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: {
        courses,
        totalCourses: courses.length
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// Helper function to check if coordinates are within geofence
function checkGeofence(latitude, longitude, corners) {
  // Simple polygon point-in-polygon algorithm
  let inside = false;
  
  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    if (((corners[i].latitude > latitude) !== (corners[j].latitude > latitude)) &&
        (longitude < (corners[j].longitude - corners[i].longitude) * (latitude - corners[i].latitude) / 
         (corners[j].latitude - corners[i].latitude) + corners[i].longitude)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Helper function to validate device ID (stateless)
async function handleDeviceValidation(matricNumber, deviceId, sessionId) {
  try {
    // Find the most recent attendance record with this device ID
    const deviceOwner = await findDeviceOwner(deviceId);
    
    // If no one has used this device before, it's available
    if (!deviceOwner) {
      return { success: true };
    }
    
    // If the same matric number used this device before, allow it
    if (deviceOwner.matricNumber === matricNumber) {
      return { success: true };
    }
    
    // Device is tied to a different matric number
    return {
      success: false,
      message: 'This device is already tied to another student account',
      conflictInfo: {
        matricNumber: deviceOwner.matricNumber,
        name: deviceOwner.name
      }
    };
    
  } catch (error) {
    console.error('Device validation error:', error);
    return {
      success: false,
      message: 'Error validating device'
    };
  }
}

// Helper function to find who owns a device (stateless)
async function findDeviceOwner(deviceId) {
  try {
    // Find the most recent attendance record with this device ID
    const sessionWithDevice = await AttendanceSession.findOne({
      'attendees.deviceIdUsed': deviceId
    }).sort({ createdAt: -1 });

    if (!sessionWithDevice) {
      return null;
    }

    // Find the specific attendee who used this device
    const attendee = sessionWithDevice.attendees
      .filter(att => att.deviceIdUsed === deviceId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    return attendee || null;
  } catch (error) {
    console.error('Find device owner error:', error);
    return null;
  }
}