import express from 'express';
import { lecturerSignUp, verifyEmail } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/lecturer-signup', lecturerSignUp);
router.get('/verify-email', verifyEmail);

export default router;
