import Session from '../models/attendanceSession.model.js';
import User from '../models/user.model.js';
import OverrideRequest from '../models/overrideRequest.model.js';

export const createSession = async (req, res) => {
  try {
    const { courseId, lecturerId, locationId, startTime, endTime } = req.body;

    if (!courseId || !lecturerId || !locationId || !startTime || !endTime) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const newSession = new Session({
      courseId,
      lecturerId,
      locationId,
      startTime,
      endTime,
    });

    const savedSession = await newSession.save();

    res.status(201).json(savedSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res
      .status(500)
      .json({ message: 'Server error. Could not create session.' });
  }
};

// export const getLiveAttendance = async (req, res) => {
//   // the lecturer clicks on his live session to view the attendees
//   // so the input is supposed to be the session id and the output is
//   // supposed to be a stream of the attendees showing their matric number
//   // their name, level
// };

export const getLiveAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await Session.findById(sessionId).populate({
      path: 'attendees.studentId',
      select: 'name level',
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    const attendeesInfo = session.attendees.map((att) => ({
      matricNumber: att.matricNumber,
      name: att.studentId.name,
      level: att.studentId.level,
      timestamp: att.timestamp,
    }));

    return res.status(200).json({ attendees: attendeesInfo });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// export const getComparison = async (req, res) => {
//   // so here this is supposed to be a stream of the number of people that I've marked slash the number of
//   // people registered for the course, so I suppose the input is the sessionId.
// };

export const getComparison = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const session = await Session.findById(sessionId).populate('courseId');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const course = session.courseId;
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const totalRegistered = course.students.length;

    const totalMarked = session.attendees.length;

    return res.status(200).json({
      courseName: course.name,
      totalRegistered,
      totalMarked,
      message: `${totalMarked}/${totalRegistered} students have been marked for this session`,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Server Error', error: error.message });
  }
};

// export const getOverrideRequests = async (req, res) => {
//     // so, this is supposed to be a stream of override requests
//     // I expect the input to be session Id
//     // and the output to be a stream of override requests
// };

export const getOverrideRequests = async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required' });
  }

  try {
    const overrideRequests = await OverrideRequest.find({ sessionId })
      .populate('studentId', 'name matricNumber')
      .populate('lecturerId', 'name');

    if (!overrideRequests.length) {
      return res
        .status(404)
        .json({ message: 'No override requests found for this session' });
    }

    return res.status(200).json({ overrideRequests });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Server Error', error: error.message });
  }
};

// export const approveOverride = async (req, res) => {
//   // when the lecturer approves it the status of that request changes to approved and
//   // the student gets added to the attendees list of that session
// };

export const approveOverride = async (req, res) => {
  try {
    const { overrideRequestId } = req.params;
    const { lecturerId } = req.body;

    const overrideRequest = await OverrideRequest.findById(overrideRequestId)
      .populate('studentId')
      .populate('sessionId');

    if (!overrideRequest) {
      return res.status(404).json({
        success: false,
        message: 'Override request not found',
      });
    }

    if (overrideRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Override request has already been ${overrideRequest.status}`,
      });
    }

    overrideRequest.status = 'approved';
    overrideRequest.lecturerId = lecturerId;
    overrideRequest.decisionTimestamp = new Date();
    await overrideRequest.save();

    const session = await Session.findById(overrideRequest.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const student = await User.findById(overrideRequest.studentId);

    session.attendees.push({
      studentId: overrideRequest.studentId._id,
      selfie: overrideRequest.selfie,
      timestamp: overrideRequest.createdAt,
      deviceIdUsed: student.deviceId || 'override-approved',
      matricNumber: student.matricNumber,
    });

    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Override request approved successfully',
      data: {
        overrideRequest,
        sessionId: overrideRequest.sessionId,
        studentAdded: true,
      },
    });
  } catch (error) {
    console.error('Error approving override request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const denyOverride = async (req, res) => {
  try {
    const { overrideRequestId } = req.params;
    const { lecturerId } = req.body;

    const overrideRequest = await OverrideRequest.findById(overrideRequestId);

    if (!overrideRequest) {
      return res.status(404).json({
        success: false,
        message: 'Override request not found',
      });
    }

    if (overrideRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Override request has already been ${overrideRequest.status}`,
      });
    }

    overrideRequest.status = 'denied';
    overrideRequest.lecturerId = lecturerId;
    overrideRequest.decisionTimestamp = new Date();
    await overrideRequest.save();

    return res.status(200).json({
      success: true,
      message: 'Override request denied',
      data: overrideRequest,
    });
  } catch (error) {
    console.error('Error denying override request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
