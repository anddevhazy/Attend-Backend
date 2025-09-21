import express from 'express';
import {
  createSession,
  getLiveAttendance,
  getComparison,
  getOverrideRequests,
  approveOverride,
  denyOverride,
} from '../controllers/lecturer.controller.js';
import { authenticateToken } from '../middleware/auth_middleware.js';

const router = express.Router();

// Middleware to ensure user is a lecturer
const ensureLecturer = (req, res, next) => {
  if (req.user.role !== 'lecturer') {
    return res.status(403).json({ message: 'Access denied: Lecturers only' });
  }
  next();
};

/**
 * @swagger
 * /api/v1/lecturer/sessions:
 *   post:
 *     summary: Create a new session
 *     description: Create a new attendance session for a lecturer.
 *     tags: [Lecturer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *                 example: CS101
 *               sessionDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-09-21T10:00:00Z
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   example: 12345
 *       403:
 *         description: Access denied, lecturer role required
 */

router.use(authenticateToken, ensureLecturer);
router.post('/sessions', createSession);
router.get('/sessions/:sessionId/attendance', getLiveAttendance);
router.get('/sessions/:sessionId/comparison', getComparison);
router.get('/sessions/:sessionId/override-requests', getOverrideRequests);
router.post('/override-requests/:overrideRequestId/approve', approveOverride);
router.post('/override-requests/:overrideRequestId/deny', denyOverride);

export default router;
