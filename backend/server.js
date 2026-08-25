
//i wasnt able to connect to the mongo atlas cluster from my home network 
//i also allowed all ip addresses in the network access settings of the mongo db cluster but still it was not working
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
try {
  const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,8.8.4.4').split(',');
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


const allowedOrigins = new Set((process.env.CORS_ORIGIN || 'http://localhost:5173').split(','));
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

// no route matched -> 404
app.use(notFound);
// catches every error thrown/forwarded anywhere above - must be last
app.use(errorHandler);


mongoose.connect(process.env.MONGO_URI  ).then(() => {
    logger.info('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error({ err }, 'MongoDB connection error');
    process.exit(1); 
  });

// catch anything that slips past express (e.g. errors in non-request code)
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Promise Rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  process.exit(1);
});