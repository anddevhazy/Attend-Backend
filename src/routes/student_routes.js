import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  fetchCourses,
  selectCourses,
  uploadCourseFormAndExtractData,
  uploadResultAndExtractData,
  confirmActivation,
  getLiveClasses,
  uploadSelfieAndRegisterDevice,
  markAttendance,
  requestOverride,
} from '../controllers/student_controller.js';
import authMiddleware from '../middleware/auth_middleware.js';

const router = express.Router();

// ... (Multer configuration remains here for functionality but is omitted from JSDoc for brevity) ...

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, and WEBP images are allowed'), false);
  }
};

// Configure multer for COURSE FORMS
const courseFormStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/course-forms/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `course-form-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const courseFormUpload = multer({
  storage: courseFormStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure multer for RESULTS
const resultStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/results/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `result-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const resultUpload = multer({
  storage: resultStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure multer for selfie uploads
const selfieStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/selfies');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'selfie-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const selfieUpload = multer({
  storage: selfieStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
});

/**
 * @swagger
 * tags:
 * name: Student
 * description: Endpoints for Students (Requires Authentication)
 * components:
 * schemas:
 * CourseMinimal:
 * type: object
 * properties:
 * _id: { type: string, example: "60c72b2f9c1d6c0015b8d0e1" }
 * code: { type: string, example: "CSC 401" }
 * title: { type: string, example: "Algorithm Analysis" }
 * units: { type: number, example: 3 }
 */
router.use(authMiddleware);

/**
 * @swagger
 * /student/fetch-courses:
 * get:
 * summary: Retrieve a list of all available courses.
 * tags: [Student]
 * security:
 * - BearerAuth: []
 * responses:
 * 200:
 * description: A list of courses available for selection.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * courses:
 * type: array
 * items:
 * $ref: '#/components/schemas/CourseMinimal'
 * totalCourses: { type: integer, example: 120 }
 * message: { type: string, example: "Courses retrieved successfully" }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/fetch-courses', fetchCourses);

/**
 * @swagger
 * /student/select-courses:
 * post:
 * summary: Select courses for the student's current semester/session.
 * tags: [Student]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - courseIds
 * properties:
 * courseIds:
 * type: array
 * items:
 * type: string
 * example: ["60c72b2f9c1d6c0015b8d0e1", "60c72b2f9c1d6c0015b8d0e2"]
 * description: Array of MongoDB IDs for the selected courses.
 * responses:
 * 200:
 * description: Courses selected and saved successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * selectedCourses:
 * type: array
 * items:
 * type: object
 * properties:
 * _id: { type: string }
 * code: { type: string }
 * title: { type: string }
 * totalSelected: { type: integer, example: 2 }
 * message: { type: string, example: "Courses selected successfully" }
 * 400:
 * description: Bad Request (invalid course ID, missing array).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/select-courses', selectCourses);

/**
 * @swagger
 * /student/course-form-upload-and-extract:
 * post:
 * summary: Upload course registration form image and extract details via OCR.
 * tags: [Student]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * properties:
 * courseForm:
 * type: string
 * format: binary
 * description: Course registration form image file (JPEG, JPG, PNG, WEBP, max 5MB).
 * responses:
 * 200:
 * description: Data extracted successfully, awaiting confirmation.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * extractedData:
 * type: object
 * properties:
 * name: { type: string, example: "John Doe" }
 * matricNumber: { type: string, example: "2019/1234567" }
 * department: { type: string, example: "Computer Science" }
 * level: { type: string, example: "400" }
 * imageUrl: { type: string, format: url, description: "Cloudinary URL of the uploaded image" }
 * message: { type: string, example: "Please verify the extracted information and confirm to activate your account" }
 * 400:
 * description: Bad Request (e.g., file required, already activated, wrong file type).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
  '/course-form-upload-and-extract',
  courseFormUpload.single('courseForm'),
  uploadCourseFormAndExtractData
);

/**
 * @swagger
 * /student/result-upload-and-extract:
 * post:
 * summary: Upload student result image (alternate activation method) and extract details via OCR.
 * tags: [Student]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * properties:
 * result:
 * type: string
 * format: binary
 * description: Student result sheet image file (JPEG, JPG, PNG, WEBP, max 5MB).
 * responses:
 * 200:
 * description: Data extracted successfully, awaiting confirmation.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * extractedData:
 * type: object
 * properties:
 * name: { type: string, example: "John Doe" }
 * matricNumber: { type: string, example: "2019/1234567" }
 * department: { type: string, example: "Computer Science" }
 * level: { type: string, example: "400" }
 * imageUrl: { type: string, format: url, description: "Cloudinary URL of the uploaded image" }
 * message: { type: string, example: "Please verify the extracted information and confirm to activate your account" }
 * 400:
 * description: Bad Request (e.g., file required, already activated, wrong file type).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
  '/result-upload-and-extract',
  resultUpload.single('result'),
  uploadResultAndExtractData
);

/**
 * @swagger
 * /student/confirm-activation:
 * post:
 * summary: Confirm the extracted details to complete student account activation.
 * tags: [Student]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * - matricNumber
 * - department
 * - level
 * properties:
 * name: { type: string, example: "John Doe" }
 * matricNumber: { type: string, example: "2019/1234567" }
 * department: { type: string, example: "Computer Science" }
 * level: { type: string, example: "400" }
 * responses:
 * 200:
 * description: Account activated successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * student: { $ref: '#/components/schemas/StudentData' }
 * message: { type: string, example: "Account activated successfully" }
 * 400:
 * description: Bad Request (e.g., missing fields, account already activated, matric number conflict).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 404:
 * description: Not Found (Student not found).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/confirm-activation', confirmActivation);

/**
 * @swagger
 * /student/get-live-classes:
 * get:
 * summary: Get all active class sessions for the student's selected courses.
 * tags: [Student]
 * security:
 * - BearerAuth: []
 * responses:
 * 200:
 * description: List of currently active class sessions.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * activeSessions:
 * type: array
 * items:
 * type: object
 * properties:
 * id: { type: string, example: "60c72b2f9c1d6c0015b8d0e3" }
 * courseName: { type: string, example: "Algorithm Analysis" }
 * lecturerName: { type: string, example: "Dr. Jane Smith" }
 * locationName: { type: string, example: "Room B201" }
 * timeRemaining: { type: number, example: 55, description: "Minutes remaining in the session" }
 * attendeeCount: { type: number, example: 45 }
 * message: { type: string, example: "Live classes retrieved successfully" }
 * 400:
 * description: Bad Request (e.g., account not activated, no courses selected).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/get-live-classes', getLiveClasses);

/**
 * @swagger
 * /student/mark-attendance:
 * post:
 * summary: Mark attendance for an active session.
 * tags: [Student]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - sessionId
 * - latitude
 * - longitude
 * properties:
 * sessionId:
 * type: string
 * example: "60c72b2f9c1d6c0015b8d0e3"
 * description: ID of the attendance session.
 * deviceId:
 * type: string
 * example: "abc-123-xyz-456"
 * description: Unique device ID (required if one is already registered).
 * latitude:
 * type: number
 * format: float
 * example: 7.215
 * description: Student's current latitude.
 * longitude:
 * type: number
 * format: float
 * example: 3.421
 * description: Student's current longitude.
 * responses:
 * 200:
 * description: Attendance marked successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * sessionName: { type: string, example: "Algorithm Analysis" }
 * timestamp: { type: string, format: date-time }
 * attendeeCount: { type: number, example: 46 }
 * message: { type: string, example: "Attendance marked successfully" }
 * 202:
 * description: Accepted, but selfie required for device registration.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: false }
 * data:
 * type: object
 * properties:
 * requiresSelfie: { type: boolean, example: true }
 * deviceId: { type: string, example: "abc-123-xyz-456" }
 * message: { type: string, example: "Selfie required for device registration" }
 * 400:
 * description: Bad Request (e.g., session ended, already marked, not in geofence, device conflict).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/mark-attendance', markAttendance);

/**
 * @swagger
 * /student/upload-selfie-and-register-device:
 * post:
 * summary: Uploads student selfie and registers the device ID for attendance.
 * tags: [Student]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * required:
 * - deviceId
 * - selfie
 * properties:
 * deviceId:
 * type: string
 * example: "abc-123-xyz-456"
 * description: Unique device ID to be registered.
 * selfie:
 * type: string
 * format: binary
 * description: A clear selfie image for facial recognition (JPEG, JPG, PNG, max 5MB).
 * responses:
 * 200:
 * description: Selfie uploaded and device registered successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * deviceId: { type: string, example: "abc-123-xyz-456" }
 * selfie: { type: string, format: url }
 * message: { type: string, example: "Device registered successfully with your selfie" }
 * 400:
 * description: Bad Request (e.g., missing file/deviceId, device already registered to another student).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
  '/upload-selfie-and-register-device',
  selfieUpload.single('selfie'),
  uploadSelfieAndRegisterDevice
);

/**
 * @swagger
 * /student/request-override:
 * post:
 * summary: Submit an override request when attendance is rejected due to device conflict.
 * tags: [Student]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - sessionId
 * - selfie
 * - deviceId
 * properties:
 * sessionId:
 * type: string
 * example: "60c72b2f9c1d6c0015b8d0e3"
 * description: ID of the attendance session.
 * selfie:
 * type: string
 * format: url
 * example: "https://cloudinary.com/selfie-url.jpg"
 * description: Cloudinary URL of the student's selfie (already uploaded).
 * deviceId:
 * type: string
 * example: "abc-123-xyz-456"
 * description: Device ID that caused the conflict.
 * responses:
 * 201:
 * description: Override request submitted successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * overrideRequestId: { type: string, example: "60c72b2f9c1d6c0015b8d0e4" }
 * realOwner:
 * type: object
 * properties:
 * matricNumber: { type: string, example: "2018/1111111" }
 * name: { type: string, example: "Original Device Owner" }
 * message: { type: string, example: "Override request submitted successfully. Waiting for lecturer approval." }
 * 400:
 * description: Bad Request (e.g., session ended, missing fields, request already submitted).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 404:
 * description: Not Found (Session or Student not found).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/request-override', requestOverride);

export default router;
