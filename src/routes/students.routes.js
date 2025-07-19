// routes/student.routes.js

import express from 'express';
import {
  getDashboard,
  markAttendance,
  requestOverride,
  selectCourses,
} from '../controllers/student.controller.js';

const router = express.Router();

// Route: GET /api/student/dashboard?chosenCourses=123,456
router.get('/dashboard', getDashboard);

// Route: POST /api/student/mark-attendance
router.post('/mark-attendance', markAttendance);

// Route: POST /api/student/request-override
router.post('/request-override', requestOverride);

// Route: GET /api/student/select-courses
router.get('/select-courses', selectCourses);

export default router;
