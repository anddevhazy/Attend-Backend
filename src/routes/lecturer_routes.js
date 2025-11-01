import express from 'express';
import {
  createSession,
  getOverrideRequests,
  approveOverride,
  denyOverride,
} from '../controllers/lecturer_controller.js';
import authMiddleware from '../middleware/auth_middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/create-session', createSession);
router.get('/get-override-requests/:sessionId', getOverrideRequests);
router.post('/approve-override', approveOverride);
router.post('/deny-override', denyOverride);

export default router;
