const logger = require('../config/logger');
//this file will handle all the errors and send the response to us
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again later.';

 //thsi will check for any bad url or invalid url
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  //checks if any field is missing 
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');  
  }

  //checks for duplicate 
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
  }

  //bad or expired jwt token
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  const logPayload = {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
  };

  if (statusCode >= 500) {
    logger.error({ ...logPayload, err }, message);
  } else {
    logger.warn(logPayload, message);
  }

  // don't leak raw error messages for unexpected 5xx errors - only our own
  // AppError instances (isOperational: true) are safe to show to the client
  const responseMessage =
    statusCode >= 500 && !err.isOperational
      ? 'Something went wrong. Please try again later.'
      : message;

  res.status(statusCode).json({
    success: false,
    message: responseMessage,
    // only leak the stack trace in development so users never see it
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;