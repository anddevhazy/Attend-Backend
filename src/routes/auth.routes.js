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
export default router;
