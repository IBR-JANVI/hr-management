/**
 * Error Middleware - Global error handler
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma validation error
  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    statusCode = 409;
    message = `${err.meta?.target?.[0] || 'Field'} already exists`;
  }

  // Prisma foreign key constraint error
  if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Invalid reference';
  }

  // JWT errors
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
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorMiddleware;
