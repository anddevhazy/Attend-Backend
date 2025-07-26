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

// Route: GET /api/v1/lecturer/live-attendance
router.get('/live-attendance', getLiveAttendance);

// Route: GET /api/v1/lecturer/comparison
router.get('/comparison', getComparison);

// Route: GET /api/v1/student/override-requests
router.get('/override-requests', getOverrideRequests);

// Route: PATCH /api/v1/lecturer/approve-override
router.patch('/approve-override', approveOverride);

// Route: PATCH /api/v1/lecturer/deny-override
router.patch('/deny-override', denyOverride);

export default router;
