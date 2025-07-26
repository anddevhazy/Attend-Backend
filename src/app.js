import express from 'express';
import studentRoutes from './routes/student.routes.js';
import lecturerRoutes from './routes/lecturer.routes.js';

const app = express();
app.use(express.json());

app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/lecturer', lecturerRoutes);

export { app };
