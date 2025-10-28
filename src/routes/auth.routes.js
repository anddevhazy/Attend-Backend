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

router.post('/lecturer-signup', lecturerSignUp);
router.get('/verify-lecturer-email', verifyLecturerEmail);
router.post('/student-signup', studentSignUp);
router.get('/verify-student-email', verifyStudentEmail);
router.post('/lecturer-login', lecturerLogin);
router.post('/student-login', studentLogin);

export default router;
