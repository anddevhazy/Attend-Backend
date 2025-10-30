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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Create uploads directories if they don't exist
const uploadDirs = ['uploads/course-forms', 'uploads/results'];
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

app.get('/', (req, res) => {
  res.send('ATTEND API');
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/lecturer', lecturerRoutes);

app.use(errorHandlerMiddleware);

export { app };
