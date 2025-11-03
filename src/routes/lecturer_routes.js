import express from 'express';
import {
  createSession,
  getOverrideRequests,
  approveOverride,
  denyOverride,
} from '../controllers/lecturer_controller.js';
import authMiddleware from '../middleware/auth_middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Lecturer
 * description: Endpoints for Lecturers (Requires Authentication)
 * components:
 * schemas:
 * CreateSessionRequest:
 * type: object
 * required:
 * - courseId
 * - locationId
 * - startTime
 * - endTime
 * properties:
 * courseId:
 * type: string
 * example: "60c72b2f9c1d6c0015b8d0e1"
 * description: MongoDB ID of the Course.
 * locationId:
 * type: string
 * example: "60c72b2f9c1d6c0015b8d0e2"
 * description: MongoDB ID of the Location (e.g., class hall).
 * startTime:
 * type: string
 * format: date-time
 * example: "2024-11-04T10:00:00.000Z"
 * description: Start time of the session (ISO 8601).
 * endTime:
 * type: string
 * format: date-time
 * example: "2024-11-04T12:00:00.000Z"
 * description: End time of the session (ISO 8601).
 */
router.use(authMiddleware);

/**
 * @swagger
 * /lecturer/create-session:
 * post:
 * summary: Create a new attendance session.
 * tags: [Lecturer]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/CreateSessionRequest'
 * responses:
 * 201:
 * description: Session created successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * id: { type: string, example: "60c72b2f9c1d6c0015b8d0e3" }
 * courseId: { type: string }
 * lecturerId: { type: string }
 * locationId: { type: string }
 * startTime: { type: string, format: date-time }
 * endTime: { type: string, format: date-time }
 * status: { type: string, example: "active" }
 * createdAt: { type: string, format: date-time }
 * message: { type: string, example: "Session created successfully" }
 * 400:
 * description: Bad Request (missing fields).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/create-session', createSession);

/**
 * @swagger
 * /lecturer/get-override-requests/{sessionId}:
 * get:
 * summary: Get all pending override requests for a specific session.
 * tags: [Lecturer]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: sessionId
 * required: true
 * schema:
 * type: string
 * example: "60c72b2f9c1d6c0015b8d0e3"
 * description: ID of the attendance session.
 * responses:
 * 200:
 * description: List of override requests.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * overrideRequests:
 * type: array
 * items:
 * type: object
 * properties:
 * studentId:
 * type: object
 * properties:
 * _id: { type: string }
 * name: { type: string }
 * matricNumber: { type: string }
 * lecturerId: { type: string }
 * status: { type: string, example: "pending" }
 * createdAt: { type: string, format: date-time }
 * selfie: { type: string, format: url, description: 'URL of the selfie image for verification' }
 * message: { type: string, example: "Override requests retrieved successfully" }
 * 400:
 * description: Bad Request (missing session ID).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 404:
 * description: Not Found (No override requests found for the session and lecturer).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/get-override-requests/:sessionId', getOverrideRequests);

/**
 * @swagger
 * /lecturer/approve-override:
 * post:
 * summary: Approve a pending override request.
 * tags: [Lecturer]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - overrideRequestId
 * properties:
 * overrideRequestId:
 * type: string
 * example: "60c72b2f9c1d6c0015b8d0e4"
 * description: ID of the override request to approve.
 * responses:
 * 200:
 * description: Override request approved and student attendance recorded.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * overrideRequest:
 * type: object
 * properties:
 * id: { type: string }
 * status: { type: string, example: "approved" }
 * studentId: { type: string }
 * sessionId: { type: string }
 * decisionTimestamp: { type: string, format: date-time }
 * sessionId: { type: string }
 * message: { type: string, example: "Override request approved successfully" }
 * 400:
 * description: Bad Request (e.g., request already approved/denied, missing ID).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 404:
 * description: Not Found (Override request or session not found).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/approve-override', approveOverride);

/**
 * @swagger
 * /lecturer/deny-override:
 * post:
 * summary: Deny a pending override request.
 * tags: [Lecturer]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - overrideRequestId
 * properties:
 * overrideRequestId:
 * type: string
 * example: "60c72b2f9c1d6c0015b8d0e4"
 * description: ID of the override request to deny.
 * responses:
 * 200:
 * description: Override request denied.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success: { type: boolean, example: true }
 * data:
 * type: object
 * properties:
 * overrideRequest:
 * type: object
 * properties:
 * id: { type: string }
 * status: { type: string, example: "denied" }
 * studentId: { type: string }
 * sessionId: { type: string }
 * decisionTimestamp: { type: string, format: date-time }
 * message: { type: string, example: "Override request denied successfully" }
 * 400:
 * description: Bad Request (e.g., request already approved/denied, missing ID).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 401:
 * description: Unauthorized (invalid/missing token).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 * 404:
 * description: Not Found (Override request not found).
 * content:
 * application/json:
 * schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/deny-override', denyOverride);

export default router;
