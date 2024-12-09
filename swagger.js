import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Lead Scraping API',
      version: '1.0.0',
      description: 'API for scraping lead data from company websites and social media profiles.',
      contact: {
        name: 'Taif Rahaman',
        email: 'taif.rahaman@lumaracode.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://lcscccgsg0o44s4kok44sgo8.157.90.145.162.sslip.io/api',

      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],  // Path to your route and controller files
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

export const setupSwagger = (app) => {
  // Serve the Swagger UI at the `/api-docs` endpoint
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};

export default swaggerDocs;
