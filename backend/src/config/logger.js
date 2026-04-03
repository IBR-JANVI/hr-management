/**
 * `@module` config/logger
 * `@description` Winston logger configuration with environment-aware transports.
 */

const winston = require('winston');
const { getConfig } = require('./env');

const { nodeEnv,logLevel  } = getConfig();
const isProduction = nodeEnv === 'production';

const logger = winston.createLogger({
  level: logLevel || (isProduction ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
 transports: isProduction
  ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })]
  : [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
 
});


module.exports = { logger };