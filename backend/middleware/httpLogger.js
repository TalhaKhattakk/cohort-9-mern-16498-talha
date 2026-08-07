const pinoHttp = require('pino-http');
const logger = require('../config/logger');

// this will log every incoming request and its response 
const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.originalUrl || req.url} -> ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.originalUrl || req.url} -> ${res.statusCode}`,
  // never log Authorization headers / passwords
  redact: {
    paths: ['req.headers.authorization', 'req.body.password'],
    remove: true,
  },
});

module.exports = httpLogger;
