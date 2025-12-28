const ApiError = require('../Utils/ApiError');
const logger = require('../Utils/logger');

/**
 * Global error handling middleware
 * Catches all errors and sends formatted response
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    statusCode: error.statusCode,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Prepare response
  const response = {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    ...(error.errors.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  // Send response
  res.status(error.statusCode).json(response);
};

/**
 * Handle 404 - Not Found
 */
const notFoundHandler = (req, res, next) => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler
};