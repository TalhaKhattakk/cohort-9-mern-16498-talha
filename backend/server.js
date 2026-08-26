//i wasnt able to connect to the mongo atlas cluster from my home network 
//i also allowed all ip addresses in the network access settings of the mongo db cluster but still it was not working
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
try {
  const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,8.8.4.4').split(',').map((s) => s.trim());
  dns.setServers(dnsServers);
} catch (e) {
  console.error('Failed to set custom DNS servers, falling back to system default:', e.message);
}

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const logger = require('./config/logger');
const httpLogger = require('./middleware/httpLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;

const isProduction = process.env.NODE_ENV === 'production';
const corsOriginEnv = process.env.CORS_ORIGIN;

const allowedOrigins = new Set(
  (corsOriginEnv || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

if (isProduction && allowedOrigins.size === 0) {
  throw new Error('CORS_ORIGIN must be configured with at least one valid origin in production');
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(httpLogger); // logs every request + response


app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

// no route matched will give 404 error
app.use(notFound);
// catches every error thrown/forwarded anywhere above
app.use(errorHandler);


mongoose.connect(process.env.MONGO_URI).then(() => {
    logger.info('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error({ err }, 'MongoDB connection error');
    process.exit(1); 
  });

// catch anything that slips past express 
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Promise Rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  process.exit(1);
});