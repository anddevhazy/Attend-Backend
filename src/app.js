import express from 'express';
import studentRoutes from './routes/student.routes.js';
import lecturerRoutes from './routes/lecturer.routes.js';
import authRoutes from './routes/auth.routes.js';
import errorHandlerMiddleware from './middleware/error-handler.js';

const app = express();
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/lecturer', lecturerRoutes);

app.use(errorHandlerMiddleware);

export { app };
