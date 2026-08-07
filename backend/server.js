
//i wasnt able to connect to the mongo atlas cluster from my home network 
//i also allowed all ip addresses in the network access settings of the mongo db cluster but still it was not working
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
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
const PORT = process.env.PORT || 5000;


app.use(cors());
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
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  process.exit(1);
});