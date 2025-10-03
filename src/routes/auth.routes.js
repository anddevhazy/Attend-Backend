import express from 'express';
import {
  studentSignUp,
  lecturerSignUp,
  login,
  logout,
  verifyEmail,
  studentExtractData,
  updateFcmToken,
  checkJobStatus,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth_middleware.js';
import { checkDuplicateUser } from '../middleware/checkDuplicateUser_middleware.js';
import {
  loginLimiter,
  extractDataLimiter,
} from '../middleware/rate_limit_middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user (student or lecturer) and return a JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 */

router.post('/student-signup', checkDuplicateUser, studentSignUp);
router.post('/lecturer-signup', checkDuplicateUser, lecturerSignUp);
router.post('/login', loginLimiter, login);
router.post('/logout', authenticateToken, logout);
router.get('/verify-email', verifyEmail);
router.post('/student-extract-data', extractDataLimiter, studentExtractData);
router.post('/update-fcm-token', authenticateToken, updateFcmToken);
router.get('/check-job/:jobId', authenticateToken, checkJobStatus);
export default router;
