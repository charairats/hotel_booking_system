const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Route files
const auth = require('./routes/auth');
const bookings = require('./routes/bookings');
const hotels = require('./routes/hotels');
const promotions = require('./routes/promotions');

// Connect to database
connectDB();

const app = express();

app.set('query parser', 'extended');

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }),
);

// Body parser
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 1000,
});
app.use(limiter);

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Sanitize data
app.use(mongoSanitize());

// Cookie parser
app.use(cookieParser());

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel Booking API',
      version: '1.0.0',
      description: 'API documentation for Hotel Booking System',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
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
  },
  apis: ['./routes/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/bookings', bookings);
app.use('/api/v1/hotels', hotels);
app.use('/api/v1/promotions', promotions);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    'Server running in ',
    process.env.NODE_ENV,
    ' mode on port ',
    PORT,
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
});
