/**
 * @module errorMiddleware
 * @description Global error handler middleware for Express applications
 */
const { logger } = require('../../config/logger');
const { getConfig } = require('../../config/env');

const { nodeEnv } = getConfig();

const PRISMA_ERROR_UNIQUE = 'P2002';
const PRISMA_ERROR_FOREIGN_KEY = 'P2003';

const errorMiddleware = (err, req, res, next) => {
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message;

  if (statusCode >= 500 && nodeEnv !== 'development' && !err.isOperational) {
    message = 'Internal Server Error';
  } else {
    message = err.message || 'Internal Server Error';
  }

  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  if (err.code === PRISMA_ERROR_UNIQUE) {
    statusCode = 409;
    message = `${err.meta?.target?.[0] || 'Field'} already exists`;
  }

  if (err.code === PRISMA_ERROR_FOREIGN_KEY) {
    statusCode = 400;
    message = 'Invalid reference';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
      ...(nodeEnv === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorMiddleware;
