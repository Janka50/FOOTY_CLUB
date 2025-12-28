const { validationResult } = require('express-validator');
const ApiError = require('../Utils/ApiError');

/**
 * Validation middleware
 * Checks for validation errors from express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));
    
    throw ApiError.badRequest('Validation failed', extractedErrors);
  }
  
  next();
};

module.exports = validate;