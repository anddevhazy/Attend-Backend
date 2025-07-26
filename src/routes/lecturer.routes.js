import express from 'express';
import {
  createSession,
  getLiveAttendance,
  getComparison,
  getOverrideRequests,
  approveOverride,
  denyOverride,
} from '../controllers/lecturer.controller.js';

const router = express.Router();

// Route: POST /api/v1/lecturer/create-session
router.post('/create-session', createSession);

// Route: GET /api/v1/lecturer/:sessionId/live-attendance
router.get('/:sessionId/live-attendance', getLiveAttendance);

// Route: GET /api/v1/lecturer/comparison
// router.get('/comparison', getComparison);

// Route: GET /api/v1/lecturer/:sessionId/comparison
router.get('/:sessionId/comparison', getComparison);

// Route: GET /api/v1/student/:sessionId/override-requests
router.get('/:sessionId/override-requests', getOverrideRequests);

// Route: PATCH /api/v1/lecturer/:sessionId/approve-override
router.patch('/:sessionId/approve-override', approveOverride);

// Route: PATCH /api/v1/lecturer/:sessionId/deny-override
router.patch('/:sessionId/deny-override', denyOverride);

export default router;
