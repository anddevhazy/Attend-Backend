// src/routes/student_routes.js
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
router.use(authMiddleware);

// Multer config
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images allowed'), false);
};

const courseFormUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/course-forms/'),
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `course-form-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const resultUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/results/'),
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `result-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const selfieUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/selfies'),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'selfie-' + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) cb(null, true);
    else cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  },
});

/**
 * @swagger
 * /api/v1/student/fetch-courses:
 *   get:
 *     summary: Get all available courses
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of courses }
 */

/**
 * @swagger
 * /api/v1/student/select-courses:
 *   post:
 *     summary: Select courses for student
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseIds]
 *             properties:
 *               courseIds: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Courses selected }
 */

/**
 * @swagger
 * /api/v1/student/course-form-upload-and-extract:
 *   post:
 *     summary: Upload course form & extract data
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               courseForm:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Data extracted }
 */

/**
 * @swagger
 * /api/v1/student/result-upload-and-extract:
 *   post:
 *     summary: Upload result & extract data
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               result:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Data extracted }
 */

/**
 * @swagger
 * /api/v1/student/confirm-activation:
 *   post:
 *     summary: Confirm extracted data & activate account
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, matricNumber, department, level]
 *             properties:
 *               name: { type: string }
 *               matricNumber: { type: string }
 *               department: { type: string }
 *               level: { type: string }
 *     responses:
 *       200: { description: Account activated }
 */

/**
 * @swagger
 * /api/v1/student/get-live-classes:
 *   get:
 *     summary: Get live attendance sessions
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of active sessions }
 */

/**
 * @swagger
 * /api/v1/student/mark-attendance:
 *   post:
 *     summary: Mark attendance
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, latitude, longitude]
 *             properties:
 *               sessionId: { type: string }
 *               deviceId: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       200: { description: Attendance marked }
 */

/**
 * @swagger
 * /api/v1/student/upload-selfie-and-register-device:
 *   post:
 *     summary: Upload selfie & register device
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               selfie:
 *                 type: string
 *                 format: binary
 *               deviceId:
 *                 type: string
 *     responses:
 *       200: { description: Device registered }
 */

/**
 * @swagger
 * /api/v1/student/request-override:
 *   post:
 *     summary: Request attendance override
 *     tags: [Student]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, selfie, deviceId]
 *             properties:
 *               sessionId: { type: string }
 *               selfie: { type: string }
 *               deviceId: { type: string }
 *     responses:
 *       201: { description: Override requested }
 */

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
