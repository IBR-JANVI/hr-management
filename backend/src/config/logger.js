/**
 * `@module` config/logger
 * `@description` Winston logger configuration with environment-aware transports.
 */

const winston = require('winston');
const { getConfig } = require('./env');

const { nodeEnv } = getConfig();

const logger = winston.createLogger({
  level: nodeEnv === 'production' ? 'info' : 'debug',
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