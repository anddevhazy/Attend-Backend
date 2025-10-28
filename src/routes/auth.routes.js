import express from 'express';
import {
  lecturerSignUp,
  verifyLecturerEmail,
  studentSignUp,
  verifyStudentEmail,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/lecturer-signup', lecturerSignUp);
router.get('/verify-lecturer-email', verifyLecturerEmail);
router.post('/student-signup', studentSignUp);
router.get('/verify-student-email', verifyStudentEmail);

export default router;
