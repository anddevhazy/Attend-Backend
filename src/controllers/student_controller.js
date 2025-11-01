import { StatusCodes } from 'http-status-codes';
import Course from '../models/course_model.js';
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  InternalServerError,
} from '../errors/index.js';
import Student from '../models/student_model.js';
import OverrideRequest from '../models/override_request_model.js';
import Session from '../models/attendance_session_model.js';
// eslint-disable-next-line no-unused-vars
import Location from '../models/location_model.js';
import formatResponseUtil from '../utils/global/format_response_util.js';
import validateRequiredFieldsUtil from '../utils/global/validate_required_fields_util.js';
import { extractCourseFormDataUtil } from '../utils/student/details_extraction_util.js';
import { extractResultDataUtil } from '../utils/student/details_extraction_util.js';
import { uploadCourseFormsToCloudinaryUtil } from '../utils/student/cloudinary_upload_util.js';
import { uploadResultsToCloudinaryUtil } from '../utils/student/cloudinary_upload_util.js';
import {
  checkGeofenceUtil,
  fetchOriginalOwnerUtil,
  handleDeviceValidationUtil,
} from '../utils/student/mark_attendance_util.js';
import { uploadSelfieToCloudinaryUtil } from '../utils/student/cloudinary_upload_util.js';

export const fetchCourses = async (req, res, next) => {
  try {
    // 1️⃣ Retrieve all course documents from the database
    // - Only select the 'name' and '_id' fields to reduce payload size
    // - Sort results alphabetically by course title for cleaner UI presentation
    const courses = await Course.find({})
      .select('units title code _id')
      .sort({ title: 1 })
      .lean(); // Convert Mongoose documents to plain JS objects for faster performance

    // 2️⃣ Send standardized response
    // - Include the list of courses and total count
    return formatResponseUtil(res, StatusCodes.OK, {
      courses,
      totalCourses: courses.length,
    });
  } catch (error) {
    // 3️⃣ Pass any errors to global error handler middleware
    next(error);
  }
};

export const selectCourses = async (req, res, next) => {
  try {
    const { courseIds } = req.body; // Array of course IDs
    const studentId = req.user.id; // From auth middleware

    // Validate required fields
    validateRequiredFieldsUtil(['courseIds'], req.body);

    // Validate courseIds is an array
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      throw new BadRequestError('courseIds must be a non-empty array');
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Verify all course IDs exist
    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
      throw new BadRequestError('One or more course IDs are invalid');
    }

    // Update student's selected courses
    student.selectedCourses = courseIds;
    await student.save();

    // Fetch updated student with populated courses
    const updatedStudent = await Student.findById(studentId)
      .select('selectedCourses')
      .populate('selectedCourses', 'code title');

    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        selectedCourses: updatedStudent.selectedCourses,
        totalSelected: updatedStudent.selectedCourses.length,
      },
      'Courses selected successfully'
    );
  } catch (error) {
    console.error('SELECT COURSES Error:', error);
    next(error);
  }
};

export const uploadCourseFormAndExtractData = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      throw new UnauthenticatedError('Student Must be Logged In');
    }

    // Check if file was uploaded
    if (!req.file) {
      throw new BadRequestError('Course form image is required');
    }

    // Find student
    const student = await Student.findById(req.user.id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if already activated
    if (student.isActivated) {
      throw new BadRequestError('Account is already activated');
    }

    // Upload image to cloudinary
    const uploadResult = await uploadCourseFormsToCloudinaryUtil(
      req.file.path,
      'course-forms'
    );

    // Extract data from course form using OCR
    const extractedData = await extractCourseFormDataUtil(
      uploadResult.secure_url
    );

    // Return extracted data for confirmation
    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        extractedData: {
          name: extractedData.name,
          matricNumber: extractedData.id,
          department: extractedData.programme,
          level: extractedData.level,
        },
        imageUrl: uploadResult.secure_url,
        message:
          'Please verify the extracted information and confirm to activate your account',
      },
      'Course form data extracted successfully'
    );
  } catch (error) {
    console.error('Course Form Upload Error:', error);
    next(error);
  }
};

export const uploadResultAndExtractData = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      throw new UnauthenticatedError('Student Must be Logged In');
    }

    // Check if file was uploaded
    if (!req.file) {
      throw new BadRequestError('Result image is required');
    }

    // Find student
    const student = await Student.findById(req.user.id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if already activated
    if (student.isActivated) {
      throw new BadRequestError('Account is already activated');
    }

    // Upload image to cloudinary
    const uploadResult = await uploadResultsToCloudinaryUtil(
      req.file.path,
      'results'
    );

    // Extract data from course form using OCR
    const extractedData = await extractResultDataUtil(uploadResult.secure_url);

    // Return extracted data for confirmation
    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        extractedData: {
          name: extractedData.name,
          matricNumber: extractedData.id,
          department: extractedData.programme,
          level: extractedData.level,
        },
        imageUrl: uploadResult.secure_url,
        message:
          'Please verify the extracted information and confirm to activate your account',
      },
      'Result data extracted successfully'
    );
  } catch (error) {
    console.error('Result Upload Error:', error);
    next(error);
  }
};

export const confirmActivation = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      throw new UnauthenticatedError('Authentication required');
    }

    const { name, matricNumber, department, level } = req.body;

    // Validate required fields
    validateRequiredFieldsUtil(
      ['name', 'matricNumber', 'department', 'level'],
      req.body
    );

    // Find student
    const student = await Student.findById(req.user.id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if already activated
    if (student.isActivated) {
      throw new BadRequestError('Account is already activated');
    }

    // Check if matric number is already in use
    const existingStudent = await Student.findOne({
      matricNumber: matricNumber,
      _id: { $ne: student._id },
    });

    if (existingStudent) {
      throw new BadRequestError('This Matric Number has been activated');
    }

    // Update student information
    student.name = name;
    student.matricNumber = matricNumber;
    student.department = department;
    student.level = level;
    student.isActivated = true;

    await student.save();

    // Return success response
    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        student: {
          id: student._id,
          email: student.email,
          name: student.name,
          matricNumber: student.matricNumber,
          department: student.department,
          level: student.level,
          isActivated: student.isActivated,
        },
      },
      'Account activated successfully'
    );
  } catch (error) {
    console.error('Account Activation Confirmation Error:', error);
    next(error);
  }
};

// Controller to fetch and return the user's dashboard data
export const getLiveClasses = async (req, res, next) => {
  try {
    // 1️⃣ Fetch student's activation + selected courses
    const student = await Student.findById(req.user.id).select(
      'isActivated selectedCourses'
    );

    if (!student) {
      throw new BadRequestError('Student record not found.');
    }

    if (!student.isActivated) {
      throw new BadRequestError(
        'Account must be activated to view Live Classes.'
      );
    }

    if (!student.selectedCourses || student.selectedCourses.length === 0) {
      throw new BadRequestError(
        ' This student hasnt enrolled for any courses.'
      );
    }

    // 2️⃣ Build course filter using student's selectedCourses
    const idOfChosenCourses = student.selectedCourses.map(String);

    // 3️⃣ Query for all currently active sessions (not yet expired)
    const activeSessions = await Session.find({
      courseId: { $in: idOfChosenCourses },
      endTime: { $gt: new Date() }, // Exclude expired sessions
    })
      .select('courseId lecturerId locationId attendees endTime')
      .populate('courseId', 'name')
      .populate('lecturerId', 'name')
      .populate('locationId', 'name')
      .lean();

    // 4️⃣ Transform raw session data into a frontend-friendly format
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

    // 5️⃣ Send standardized success response
    return formatResponseUtil(res, StatusCodes.OK, {
      activeSessions: sessionsData,
    });
  } catch (error) {
    next(error);
  }
};

// Controller to handle marking attendance for a class session
export const markAttendance = async (req, res, next) => {
  try {
    // Extract relevant data from the request body
    const { sessionId, deviceId, latitude, longitude } = req.body;

    // convert to numbers
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      throw new BadRequestError('Latitude and longitude must be valid numbers');
    }

    // Ensure all required fields are provided
    validateRequiredFieldsUtil(
      ['sessionId', 'latitude', 'longitude'],
      req.body
    );

    const userId = req.user.id;
    const student = await Student.findById(userId).select(
      'matricNumber deviceId selfie'
    );
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const matricNumber = student.matricNumber;

    // ✅ Require deviceId only if student already has one registered
    if (student.deviceId && !deviceId) {
      throw new BadRequestError(
        'Device ID is required for subsequent attendance'
      );
    }

    // Fetch the session and populate location and course details
    const session = await Session.findById(sessionId)
      .select('status endTime attendees locationId courseId')
      .populate('locationId', 'corners')
      .populate('courseId', 'name')
      .exec();

    // If session not found, throw a 404 error
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Ensure session is still active and within valid time
    if (new Date() > session.endTime) {
      throw new BadRequestError('Session has ended');
    }

    // Check if the student has already marked attendance
    const hasAlreadyMarked = session.attendees.some(
      (attendee) => attendee.matricNumber === matricNumber
    );

    if (hasAlreadyMarked) {
      throw new BadRequestError('Attendance already marked for this session');
    }

    // Verify if student's current location is within the class geofence
    const isWithinGeofence = checkGeofenceUtil(
      lat,
      lon,
      session.locationId.corners
    );

    if (!isWithinGeofence) {
      throw new BadRequestError(
        'You are not within the required location for this class'
      );
    }

    // Validate device
    const deviceCheck = await handleDeviceValidationUtil(
      matricNumber,
      deviceId
    );

    // Handle different device validation scenarios
    if (!deviceCheck.success) {
      if (deviceCheck.requiresSelfie) {
        // Student needs to upload selfie to register device
        return formatResponseUtil(
          res,
          StatusCodes.ACCEPTED, // 202
          {
            requiresSelfie: true,
            deviceId: deviceId,
            message: deviceCheck.message,
          },
          'Selfie required for device registration'
        );
      } else if (deviceCheck.conflictInfo) {
        // Device is owned by another student
        throw new BadRequestError(deviceCheck.message, {
          requiresOverride: true,
          conflictInfo: deviceCheck.conflictInfo,
        });
      } else {
        // Other device validation errors
        throw new BadRequestError(deviceCheck.message);
      }
    }

    // Record attendance
    session.attendees.push({
      studentId: student._id,
      matricNumber,
      deviceIdUsed: deviceId,
      timestamp: new Date(),
    });

    await session.save();

    // Respond with success
    return formatResponseUtil(
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
export const uploadSelfieAndRegisterDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.body;

    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      throw new UnauthenticatedError('Student must be logged in');
    }

    // Validate required fields
    validateRequiredFieldsUtil(['deviceId'], req.body);

    // Check if selfie file was uploaded
    if (!req.file) {
      throw new BadRequestError('Selfie image is required');
    }

    // Find student
    const student = await Student.findById(req.user.id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if device is already tied to another student
    const deviceOwner = await Student.findOne({
      deviceId,
      _id: { $ne: req.user.id },
    }).select('matricNumber name');

    if (deviceOwner) {
      throw new BadRequestError(
        'This device is already registered to another student',
        {
          conflictInfo: {
            matricNumber: deviceOwner.matricNumber,
            name: deviceOwner.name,
          },
        }
      );
    }

    // Upload selfie to Cloudinary
    const uploadResult = await uploadSelfieToCloudinaryUtil(
      req.file.path,
      'student-selfies'
    );

    // Update student with device ID and selfie
    student.deviceId = deviceId;
    student.selfie = uploadResult.secure_url;
    await student.save();

    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        deviceId: student.deviceId,
        selfie: student.selfie,
        message: 'Device registered successfully with your selfie',
      },
      'Selfie uploaded and device registered successfully'
    );
  } catch (error) {
    console.error('Selfie Upload Error:', error);
    next(error);
  }
};

export const requestOverride = async (req, res, next) => {
  try {
    const { sessionId, selfie, deviceId } = req.body;

    validateRequiredFieldsUtil(['sessionId', 'selfie', 'deviceId'], req.body);

    const session = await Session.findById(sessionId)
      .select('endTime lecturerId')
      .lean();
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (new Date() > session.endTime) {
      throw new BadRequestError('Session has ended, cannot request override');
    }

    const userId = req.user.id;
    const student = await Student.findById(userId).select('matricNumber ');
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const matricNumber = student.matricNumber;
    const existingRequest = await OverrideRequest.findOne({
      sessionId,
      status: 'pending',
    }).lean();

    if (existingRequest) {
      throw new BadRequestError(
        'Override request already submitted for this session'
      );
    }

    const originalOwner = await fetchOriginalOwnerUtil(deviceId);
    if (!originalOwner.success) {
      throw new InternalServerError('Error fetching original device owner');
    }

    const originalOwnerId = originalOwner.conflictInfo?._id;

    if (!originalOwnerId) {
      throw new BadRequestError(
        'Could not determine the original device owner. Cannot process override request.'
      );
    }

    const overrideRequest = await OverrideRequest.create({
      studentId: student._id,
      sessionId,
      matricNumber,
      selfie,
      originalOwnerId: originalOwnerId,
      lecturerId: session.lecturerId,
      deviceIdUsed: deviceId,
    });

    const realOwnerInfo = originalOwner.conflictInfo;

    return formatResponseUtil(
      res,
      StatusCodes.CREATED,
      {
        overrideRequestId: overrideRequest._id,
        realOwner: realOwnerInfo,
      },
      'Override request submitted successfully. Waiting for lecturer approval.'
    );
  } catch (error) {
    next(error);
  }
};
