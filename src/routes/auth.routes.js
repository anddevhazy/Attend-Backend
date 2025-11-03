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
 * tags:
 * name: Auth
 * description: Authentication and User Management (Lecturer and Student)
 */

/**
 * @swagger
 * /auth/lecturer-signup:
 * post:
 * summary: Register a new lecturer account.
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * - name
 * - department
 * - college
 * properties:
 * email:
 * type: string
 * format: email
 * example: jane.doe@funaab.edu.ng
 * password:
 * type: string
 * format: password
 * example: SecureP@ss123
 * name:
 * type: string
 * example: Dr. Jane Doe
 * department:
 * type: string
 * example: Computer Science
 * college:
 * type: string
 * example: COLMAS
 * responses:
 * 200:
 * description: Verification email sent to the lecturer's email address.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * message: { type: string, example: "Verification email sent to : jane.doe@funaab.edu.ng" }
 * 400:
 * description: Bad Request (e.g., missing fields, lecturer already signed up).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 404:
 * description: Not Found (Lecturer not found in pre-seeded DB).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/lecturer-signup', lecturerSignUp);

/**
 * @swagger
 * /auth/verify-lecturer-email:
 * get:
 * summary: Verify lecturer email using a token sent in the link.
 * tags: [Auth]
 * parameters:
 * - in: query
 * name: token
 * required: true
 * schema:
 * type: string
 * description: The JWT token received via the email link.
 * responses:
 * 200:
 * description: HTML response indicating successful verification.
 * content:
 * text/html:
 * schema:
 * type: string
 * example: '<h2>✅ Your email has been verified. You can now log in to the app.</h2>'
 * 400:
 * description: Bad Request (e.g., missing token, invalid/expired link).
 * content:
 * text/html:
 * schema:
 * type: string
 * example: '<h2>❌ Verification link has expired. Please request a new one.</h2>'
 */
router.get('/verify-lecturer-email', verifyLecturerEmail);

/**
 * @swagger
 * /auth/student-signup:
 * post:
 * summary: Register a new student account.
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * example: student@funaab.edu.ng
 * password:
 * type: string
 * format: password
 * example: SecureP@ss123
 * responses:
 * 201:
 * description: Student account created and verification email sent.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * id: { type: string, example: "60c72b2f9c1d6c0015b8d0e1" }
 * email: { type: string, example: "student@funaab.edu.ng" }
 * message: { type: string, example: "Student account created & Verification Email Sent" }
 * 400:
 * description: Bad Request (e.g., missing fields).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/student-signup', studentSignUp);

/**
 * @swagger
 * /auth/verify-student-email:
 * get:
 * summary: Verify student email using a token sent in the link.
 * tags: [Auth]
 * parameters:
 * - in: query
 * name: token
 * required: true
 * schema:
 * type: string
 * description: The JWT token received via the email link.
 * responses:
 * 200:
 * description: HTML response indicating successful verification.
 * content:
 * text/html:
 * schema:
 * type: string
 * example: '<h2>✅ Your email has been verified. You can now log in to the app.</h2>'
 * 400:
 * description: Bad Request (e.g., missing token, invalid/expired link).
 * content:
 * text/html:
 * schema:
 * type: string
 * example: '<h2>❌ Verification link has expired. Please request a new one.</h2>'
 */
router.get('/verify-student-email', verifyStudentEmail);

/**
 * @swagger
 * /auth/lecturer-login:
 * post:
 * summary: Log in an existing lecturer.
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * example: jane.doe@funaab.edu.ng
 * password:
 * type: string
 * format: password
 * example: SecureP@ss123
 * responses:
 * 200:
 * description: Login successful, returns JWT token and lecturer details.
 * content:
 * application/json:
 * schema:
 * allOf:
 * - $ref: '#/components/schemas/AuthResponse'
 * - properties:
 * data:
 * properties:
 * lecturer:
 * $ref: '#/components/schemas/LecturerData'
 * 401:
 * description: Unauthorized (e.g., Invalid Password, User not found).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 400:
 * description: Bad Request (e.g., email not verified yet).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/lecturer-login', lecturerLogin);

/**
 * @swagger
 * /auth/student-login:
 * post:
 * summary: Log in an existing student.
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * example: student@funaab.edu.ng
 * password:
 * type: string
 * format: password
 * example: SecureP@ss123
 * responses:
 * 200:
 * description: Login successful, returns JWT token and student details.
 * content:
 * application/json:
 * schema:
 * allOf:
 * - $ref: '#/components/schemas/AuthResponse'
 * - properties:
 * data:
 * properties:
 * student:
 * $ref: '#/components/schemas/StudentData'
 * 401:
 * description: Unauthorized (e.g., Invalid Password, User not found).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 400:
 * description: Bad Request (e.g., email not verified yet).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/student-login', studentLogin);

export default router;
