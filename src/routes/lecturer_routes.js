import express from 'express';
import { createSession } from '../controllers/lecturer_controller.js';
import authMiddleware from '../middleware/auth_middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/create-session', createSession);

export default router;
