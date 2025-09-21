import express from 'express';
import studentRoutes from './routes/student.routes.js';
import lecturerRoutes from './routes/lecturer.routes.js';
import authRoutes from './routes/auth.routes.js';
import errorHandlerMiddleware from './middleware/error-handler.js';
import helmet from 'helmet';
import cors from 'cors';
import xss from 'xss-clean';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ATTEND API',
    version: '1.0.0',
    description: 'API for FUNAAB Attendance Taking App',
  },
  servers: [
    {
      url: 'https://attend-class-bd03d7413cb6.herokuapp.com/',
      description: 'Production server',
    },
    {
      url: 'http://localhost:8000',
      description: 'Local server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());

app.get('/', (req, res) => {
  res.send('ATTEND API');
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/lecturer', lecturerRoutes);

app.use(errorHandlerMiddleware);

export { app };
