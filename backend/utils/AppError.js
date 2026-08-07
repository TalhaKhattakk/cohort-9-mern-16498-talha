//a known expected error we threw on purpose e.g bad input, not found etc
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // marks it as an expected error, not a bug
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
