const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { xss } = require('express-xss-sanitizer');
const hpp = require('hpp');


const app = express();

app.use(helmet.default());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode');
  app.use(morgan('dev'));
} else {
  console.log('Running in production mode');
  app.use(morgan('combined'));
}

app.use(express.json());
app.use(xss());
app.use(hpp());


app.use((req, res, next) => {
  next(new Error(404, `Route not found: ${req.method} ${req.originalUrl}`));
});


module.exports = app;