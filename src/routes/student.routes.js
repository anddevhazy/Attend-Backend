import express from 'express';
import {
  getDashboard,
  markAttendance,
  requestOverride,
  selectCourses,
  enrollInCourses,
} from '../controllers/student.controller.js';
import { authenticateToken } from '../middleware/auth_middleware.js';
import { attendanceLimiter } from '../middleware/rate_limit_middleware.js';

const router = express.Router();

// Middleware to ensure user is a student
const ensureStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied: Students only' });
  }
  next();
};

/**
 * @swagger
 * /api/v1/student/dashboard:
 *   get:
 *     summary: Get student dashboard
 *     description: Retrieve the dashboard data for a logged-in student.
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 studentId:
 *                   type: string
 *                   example: 12345
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: CS101
 *       403:
 *         description: Access denied, student role required
 */

router.use(authenticateToken, ensureStudent);
router.get('/dashboard', getDashboard);
router.post('/attendance', attendanceLimiter, markAttendance);
router.post('/override-request', requestOverride);
router.get('/courses', selectCourses);
router.post('/enroll', enrollInCourses);

export default router;
