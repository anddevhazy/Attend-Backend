// src/routes/lecturer_routes.js
import express from 'express';
import {
  createSession,
  getOverrideRequests,
  approveOverride,
  denyOverride,
} from '../controllers/lecturer_controller.js';
import authMiddleware from '../middleware/auth_middleware.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/lecturer/create-session:
 *   post:
 *     summary: Create attendance session
 *     tags: [Lecturer]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, locationId, startTime, endTime]
 *             properties:
 *               courseId: { type: string }
 *               locationId: { type: string }
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *     responses:
 *       201: { description: Session created }
 */

/**
 * @swagger
 * /api/v1/lecturer/get-override-requests/{sessionId}:
 *   get:
 *     summary: Get override requests for a session
 *     tags: [Lecturer]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of override requests }
 */

/**
 * @swagger
 * /api/v1/lecturer/approve-override:
 *   post:
 *     summary: Approve override request
 *     tags: [Lecturer]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [overrideRequestId]
 *             properties:
 *               overrideRequestId: { type: string }
 *     responses:
 *       200: { description: Override approved }
 */

/**
 * @swagger
 * /api/v1/lecturer/deny-override:
 *   post:
 *     summary: Deny override request
 *     tags: [Lecturer]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [overrideRequestId]
 *             properties:
 *               overrideRequestId: { type: string }
 *     responses:
 *       200: { description: Override denied }
 */

router.post('/create-session', createSession);
router.get('/get-override-requests/:sessionId', getOverrideRequests);
router.post('/approve-override', approveOverride);
router.post('/deny-override', denyOverride);

export default router;
