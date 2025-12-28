const jwt = require('jsonwebtoken');
const ApiError = require('../Utils/ApiError');
const asyncHandler = require('../Utils/asyncHandler');
const { User, Session } = require('../models');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Access token is required');
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session exists and is valid
    const session = await Session.findOne({
      where: { token, userId: decoded.userId }
    });

    if (!session) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    if (session.isExpired()) {
      await session.destroy();
      throw ApiError.unauthorized('Token has expired');
    }

    // Get user
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Attach user to request
    req.user = user;
    req.session = session;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Token has expired');
    }
    throw error;
  }
});

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!roles.includes(req.user.accountType)) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token is provided
 * but doesn't fail if token is missing
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      await authenticate(req, res, next);
    } catch (error) {
      // Continue without user if token is invalid
      next();
    }
  } else {
    next();
  }
});

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};