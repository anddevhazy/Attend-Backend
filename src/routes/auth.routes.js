// src/routes/auth.routes.js
import express from 'express';
import {
  lecturerSignUp,
  verifyLecturerEmail,
  studentSignUp,
  verifyStudentEmail,
  studentLogin,
  lecturerLogin,
} from '../controllers/auth.controller.js';

const router = express.Router();

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
 *               email: { type: string, example: "lecturer@funaab.edu.ng" }
 *               password: { type: string, example: "password123" }
 *               name: { type: string, example: "Dr. John Doe" }
 *               department: { type: string, example: "Computer Science" }
 *               college: { type: string, example: "COLNAS" }
 *     responses:
 *       200: { description: Verification email sent }
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
 *               email: { type: string, example: "student@funaab.edu.ng" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       201: { description: Student created, email sent }
 */

/**
 * @swagger
 * /api/v1/auth/verify-lecturer-email:
 *   get:
 *     summary: Verify lecturer email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Email verified }
 */

/**
 * @swagger
 * /api/v1/auth/verify-student-email:
 *   get:
 *     summary: Verify student email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Email verified }
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
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful, returns JWT }
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
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful, returns JWT }
 */

router.post('/lecturer-signup', lecturerSignUp);
router.get('/verify-lecturer-email', verifyLecturerEmail);
router.post('/student-signup', studentSignUp);
router.get('/verify-student-email', verifyStudentEmail);
router.post('/lecturer-login', lecturerLogin);
router.post('/student-login', studentLogin);

export default router;
