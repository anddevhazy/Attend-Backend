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

router.use(authMiddleware);

router.get('/fetch-courses', fetchCourses);
router.post('/select-courses', selectCourses);
router.post('/confirm-activation', confirmActivation);
router.post(
  '/result-upload-and-extract',
  resultUpload.single('result'),
  uploadResultAndExtractData
);
router.post(
  '/course-form-upload-and-extract',
  courseFormUpload.single('courseForm'),
  uploadCourseFormAndExtractData
);
router.get('/get-live-classes', getLiveClasses);
router.post('/mark-attendance', markAttendance);
router.post(
  '/upload-selfie-and-register-device',
  selfieUpload.single('selfie'),
  uploadSelfieAndRegisterDevice
);
router.post('/request-override', requestOverride);

export default router;
