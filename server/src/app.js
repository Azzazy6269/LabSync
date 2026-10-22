const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { xss } = require('express-xss-sanitizer');
const hpp = require('hpp');
const limiter = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');



const app = express();
app.use(express.json());
//console.log({ limiter, errorHandler, xss });
if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode');
  app.use(morgan('dev'));
} else {
  console.log('Running in production mode');
  app.use(morgan('combined'));
}

// Middlewares
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(xss());
app.use(hpp());
app.use(limiter);


// Routers
app.use(errorHandler);


module.exports = app;