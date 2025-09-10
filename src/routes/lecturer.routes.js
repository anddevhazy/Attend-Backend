import express from 'express';
import {
  createSession,
  getLiveAttendance,
  getComparison,
  getOverrideRequests,
  approveOverride,
  denyOverride,
} from '../controllers/lecturerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to ensure user is a lecturer
const ensureLecturer = (req, res, next) => {
  if (req.user.role !== 'lecturer') {
    return res.status(403).json({ message: 'Access denied: Lecturers only' });
  }
  next();
};

// Routes
router.use(authenticateToken, ensureLecturer);
router.post('/sessions', createSession);
router.get('/sessions/:sessionId/attendance', getLiveAttendance);
router.get('/sessions/:sessionId/comparison', getComparison);
router.get('/sessions/:sessionId/override-requests', getOverrideRequests);
router.post('/override-requests/:overrideRequestId/approve', approveOverride);
router.post('/override-requests/:overrideRequestId/deny', denyOverride);

export default router;
