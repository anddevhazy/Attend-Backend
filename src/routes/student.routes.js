import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getDashboard,
  markAttendance,
  requestOverride,
  selectCourses,
  enrollInCourses,
} from '../controllers/studentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rate limiter for marking attendance
const attendanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 attendance attempts
  message: 'Too many attendance attempts, please try again later.',
});

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
