import express from 'express';
import {
  studentSignUp,
  lecturerSignUp,
  login,
  logout,
  verifyEmail,
  // studentExtractData,
  updateFcmToken,
  checkActivateAccountStatus,
  activateAccount,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth_middleware.js';
import { checkDuplicateUser } from '../middleware/checkDuplicateUser_middleware.js';
import {
  loginLimiter,
  extractDataLimiter,
} from '../middleware/rate_limit_middleware.js';
import { createQueue } from '../queues/redis.js';

const router = express.Router();

router.post('/student-signup', checkDuplicateUser, studentSignUp);
router.post('/lecturer-signup', lecturerSignUp);
router.post('/login', loginLimiter, login);
router.post('/logout', authenticateToken, logout);
router.get('/verify-email', verifyEmail);
// router.post('/student-extract-data', extractDataLimiter, studentExtractData);
router.post('/update-fcm-token', authenticateToken, updateFcmToken);
router.get(
  '/check-activate-account/:jobId',
  authenticateToken,
  checkActivateAccountStatus
);
router.post(
  '/activate-account',
  authenticateToken,
  extractDataLimiter,
  activateAccount
);
router.get('/test-email', async (req, res) => {
  try {
    const queue = createQueue('send-verification-email');
    await queue.add('test', {
      user: { email: process.env.EMAIL_USER, name: 'Test User' },
      verificationToken: 'fake-token-123',
    });
    res.json({ ok: true, msg: 'job queued' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
export default router;
