const winston = require('winston');

const nodeEnv = process.env.NODE_ENV || 'development';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

if (nodeEnv === 'production') {
  logger.add(new winston.transports.File({ filename: 'logs/error.log' }));
}

module.exports = { logger };