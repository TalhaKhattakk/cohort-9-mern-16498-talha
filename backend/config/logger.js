const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';
//this will have a central logger config, which can be used accross all the files
//also the pino-pretty is used to get colored logs in terminal
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
});

module.exports = logger;
