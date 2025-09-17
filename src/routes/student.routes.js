import express from 'express';
import {
  getDashboard,
  markAttendance,
  requestOverride,
  selectCourses,
  enrollInCourses,
} from '../controllers/studentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { attendanceLimiter } from '../middleware/rate_limit_middleware.js';

const router = express.Router();

// Middleware to ensure user is a student
const ensureStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied: Students only' });
  }
  next();
};

router.use(authenticateToken, ensureStudent); // Apply to all student routes
router.get('/dashboard', getDashboard);
router.post('/attendance', attendanceLimiter, markAttendance);
router.post('/override-request', requestOverride);
router.get('/courses', selectCourses);
router.post('/enroll', enrollInCourses);

export default router;
