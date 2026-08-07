const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

//checks if the jwt is configured
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET must be configured');
}

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No authentication token provided. Authorization denied.', 401));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError('Authentication token missing. Authorization denied.', 401));
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn({ err: error }, 'Invalid or expired token used');
    return next(new AppError('Token is invalid or expired. Authorization denied.', 401));
  }
};

module.exports = auth;