import express from 'express';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student_route.js';
import errorHandlerMiddleware from './middleware/error_handler_middleware.js';
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
app.use('/api/v1/auth', studentRoutes);

app.use(errorHandlerMiddleware);

export { app };
