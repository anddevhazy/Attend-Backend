import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  fetchCourses,
  selectCourses,
  uploadCourseFormAndExtractData,
  uploadResultAndExtractData,
  confirmActivation,
} from '../controllers/student_controller.js';
import authMiddleware from '../middleware/auth_middleware.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/course-forms/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `course-form-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, and WEBP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.use(authMiddleware);

router.get('/fetch-courses', fetchCourses);
router.post('/select-courses', selectCourses);
router.post('/confirm-activation', confirmActivation);
router.post(
  '/result-upload-and-extract',
  // eslint-disable-next-line no-undef
  upload.single(result),
  uploadResultAndExtractData
);
router.post(
  '/course-form-upload-and-extract',
  // eslint-disable-next-line no-undef
  upload.single(courseForm),
  uploadCourseFormAndExtractData
);

export default router;
