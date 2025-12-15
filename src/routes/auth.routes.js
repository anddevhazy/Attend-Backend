// src/routes/auth.routes.js
import express from 'express';
import {
  lecturerSignUp,
  verifyLecturerEmail,
  studentSignUp,
  verifyStudentEmail,
  studentLogin,
  lecturerLogin,
  refreshAccessToken,
  logout,
} from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & session management
 */

/**
 * @swagger
 * /api/v1/auth/lecturer-signup:
 *   post:
 *     summary: Lecturer signup (pre-seeded email)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, department, college]
 *             properties:
 *               email:
 *                 type: string
 *                 example: lecturer@funaab.edu.ng
 *               password:
 *                 type: string
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: Dr. John Doe
 *               department:
 *                 type: string
 *                 example: Computer Science
 *               college:
 *                 type: string
 *                 example: COLNAS
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Bad request (already signed up / invalid data)
 *       404:
 *         description: Lecturer not employed (not found in seeded DB)
 */

/**
 * @swagger
 * /api/v1/auth/student-signup:
 *   post:
 *     summary: Student signup
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: student@funaab.edu.ng
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Student created & verification email sent
 *       400:
 *         description: Bad request (invalid data)
 */

/**
 * @swagger
 * /api/v1/auth/verify-lecturer-email:
 *   get:
 *     summary: Verify lecturer email
 *     tags: [Auth]
 *     description: Verifies a lecturer email using the token sent via email.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified (returns HTML page)
 *       400:
 *         description: Missing/invalid/expired token
 */

/**
 * @swagger
 * /api/v1/auth/verify-student-email:
 *   get:
 *     summary: Verify student email
 *     tags: [Auth]
 *     description: Verifies a student email using the token sent via email.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified (returns HTML page)
 *       400:
 *         description: Missing/invalid/expired token
 */

/**
 * @swagger
 * /api/v1/auth/lecturer-login:
 *   post:
 *     summary: Lecturer login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: lecturer@funaab.edu.ng
 *               password:
 *                 type: string
 *                 example: password123
 *               deviceId:
 *                 type: string
 *                 nullable: true
 *                 example: "android-7b6f2d0c"
 *                 description: Optional device identifier used to bind refresh tokens to a device/session.
 *     responses:
 *       200:
 *         description: Login successful (returns accessToken & refreshToken)
 *       400:
 *         description: Email not verified / bad request
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/v1/auth/student-login:
 *   post:
 *     summary: Student login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: student@funaab.edu.ng
 *               password:
 *                 type: string
 *                 example: password123
 *               deviceId:
 *                 type: string
 *                 nullable: true
 *                 example: "ios-1a2b3c4d"
 *                 description: Optional device identifier used to bind refresh tokens to a device/session.
 *     responses:
 *       200:
 *         description: Login successful (returns accessToken & refreshToken)
 *       400:
 *         description: Email not verified / bad request
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/v1/auth/refresh-access-token:
 *   post:
 *     summary: Rotate refresh token and mint a new access token
 *     tags: [Auth]
 *     description: |
 *       Validates refresh token, checks revocation/hash match, revokes old token, then issues a new access token + refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token previously issued at login/refresh.
 *     responses:
 *       200:
 *         description: New accessToken and refreshToken issued
 *       401:
 *         description: Invalid/expired/revoked refresh token
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout (revoke refresh token)
 *     tags: [Auth]
 *     description: Revokes the provided refresh token (best-effort). Always returns OK to avoid leaking token validity.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out
 */

router.post('/lecturer-signup', lecturerSignUp);
router.get('/verify-lecturer-email', verifyLecturerEmail);

router.post('/student-signup', studentSignUp);
router.get('/verify-student-email', verifyStudentEmail);

router.post('/lecturer-login', lecturerLogin);
router.post('/student-login', studentLogin);

router.post('/refresh-access-token', refreshAccessToken);
router.post('/logout', logout);

export default router;
