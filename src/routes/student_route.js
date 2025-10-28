import express from 'express';
import {
  fetchCourses,
  selectCourses,
} from '../controllers/student_controller.js';
import authMiddleware from '../middleware/auth_middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/fetch-courses', fetchCourses);
router.post('/select-courses', selectCourses);

export default router;
