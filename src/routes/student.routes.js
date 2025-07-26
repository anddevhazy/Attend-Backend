import express from 'express';
import {
  getDashboard,
  markAttendance,
  requestOverride,
  selectCourses,
  enrollInCourses,
} from '../controllers/student.controller.js';

const router = express.Router();

// Route: GET /api/v1/student/dashboard?chosenCourses=123,456
router.get('/dashboard', getDashboard);

// Route: POST /api/v1/student/mark-attendance
router.post('/mark-attendance', markAttendance);

// Route: POST /api/v1/student/request-override
router.post('/request-override', requestOverride);

// Route: GET /api/v1/student/select-courses
router.get('/select-courses', selectCourses);

// Route: POST /api/v1/student/enroll-courses
router.post('/enroll-courses', enrollInCourses);

export default router;

// request-override test input
// {
//   "sessionId": "66a93d36c321c52f9bbcf4a7",
//   "selfie": "base64string",
//   "deviceId": "1381787",
//   "matricNumber": "20201771",
//   "name": "Ayo"
// }
