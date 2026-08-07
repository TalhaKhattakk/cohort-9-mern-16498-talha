const AppError = require('../utils/AppError');

//shows an error if route is invalid
const notFound = (req, res, next) => {
  next(new AppError(`Route not found - ${req.method} ${req.originalUrl}`, 404));
};

module.exports = notFound;
