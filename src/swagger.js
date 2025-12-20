import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ATTEND API',
      version: '1.0.0',
      description: 'Backend API for FUNAAB Attendance System',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Local server',
      },
      {
        url: 'https://attend-api-3xom.onrender.com',
        description: 'Production server',
      },
      {
        url: 'https://attend-api-staging.onrender.com',
        description: 'Staging server',
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
