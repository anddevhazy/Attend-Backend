import express from 'express';
import { lecturerSignUp } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/lecturer-signup', lecturerSignUp);

export default router;
