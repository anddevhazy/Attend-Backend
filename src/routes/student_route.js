import express from 'express';
import { fetchCourses } from '../controllers/student_controller.js';

const router = express.Router();

router.get('/fetch-courses', fetchCourses);

export default router;
