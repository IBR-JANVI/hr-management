/**
 * @module errorMiddleware
 * @description Global error handler middleware for Express applications
 */
const { logger } = require('../../config/logger');
const { getConfig } = require('../../config/env');

const { nodeEnv } = getConfig();

const errorMiddleware = (err, req, res, next) => {
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

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

  if (err.code === 'P2002') {
    statusCode = 409;
    message = `${err.meta?.target?.[0] || 'Field'} already exists`;
  }

  if (err.code === 'P2003') {
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

  if (statusCode >= 500 && nodeEnv !== 'development' && !err.isOperational) {
    message = 'Internal Server Error';
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
