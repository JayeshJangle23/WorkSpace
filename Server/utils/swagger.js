const swaggerAutogen = require('swagger-autogen')({ 
  openapi: '3.0.0',
  autoHeaders: false 
}); 

const doc = {
  info: {
    title: 'My Express API Dashboard',
    version: '1.0.0',
    description: 'Testing endpoints with automated bearer authentication workflows',
  },
  host: 'localhost:3000',
  openapi: '3.0.0', 
  security: [
    {
      bearerAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste your raw JWT token string here.'
      }
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['../index.js']; 

swaggerAutogen(outputFile, endpointsFiles, doc);
