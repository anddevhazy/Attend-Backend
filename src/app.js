import express from 'express';
import studentRoutes from './routes/student.routes.js';
import lecturerRoutes from './routes/lecturer.routes.js';
import authRoutes from './routes/auth.routes.js';
import errorHandlerMiddleware from './middleware/error-handler.js';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';

const app = express();

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
