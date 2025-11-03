import express from 'express';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student_routes.js';
import lecturerRoutes from './routes/lecturer_routes.js';
import errorHandlerMiddleware from './middleware/error_handler_middleware.js';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🚀 Swagger/OpenAPI Imports
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Create uploads directories if they don't exist
const uploadDirs = [
  'uploads/course-forms',
  'uploads/results',
  'uploads/selfies',
];
uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Create temp folder for OCR image downloads
const tempDir = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log('Created temp directory for OCR');
}

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());

// --- Swagger/OpenAPI Configuration ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0', // REQUIRED: Use OpenAPI 3.0.0 specification
    info: {
      title: 'ATTEND API Documentation',
      version: '1.0.0',
      description: "API for Funaab's Attendance Taking App.",
    },
    servers: [
      {
        url: '/api/v1',
        description: 'V1 API Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer token from a successful login.',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
          },
        },
        // Common Data Structures
        StudentData: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Student User ID' },
            email: {
              type: 'string',
              format: 'email',
              example: 'student@funaab.edu.ng',
            },
            name: { type: 'string', example: 'John Doe' },
            matricNumber: { type: 'string', example: '2019/1234567' },
            department: { type: 'string', example: 'Computer Science' },
            level: { type: 'string', example: '400' },
            isActivated: { type: 'boolean', example: true },
            role: { type: 'string', example: 'student' },
          },
        },
        LecturerData: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Lecturer User ID' },
            email: {
              type: 'string',
              format: 'email',
              example: 'lecturer@funaab.edu.ng',
            },
            name: { type: 'string', example: 'Dr. Jane Smith' },
            department: { type: 'string', example: 'Computer Science' },
            college: { type: 'string', example: 'COLMAS' },
            role: { type: 'string', example: 'lecturer' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'JWT Authentication Token',
                },
                user: {
                  type: 'object',
                  oneOf: [
                    { $ref: '#/components/schemas/StudentData' },
                    { $ref: '#/components/schemas/LecturerData' },
                  ],
                  description: 'User details object (student or lecturer)',
                },
              },
            },
            message: { type: 'string', example: 'Login successful' },
          },
        },
      },
    },
  },
  apis: ['.src/routes/*.js'], // Path to your API routes files containing JSDoc
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// --- Routes Setup ---

// Root route (simple check)
app.get('/', (req, res) => {
  res.send('ATTEND API');
});

// Swagger UI Route
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true })
);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/lecturer', lecturerRoutes);

// Error Handling Middleware (must be last)
app.use(errorHandlerMiddleware);

export { app };
