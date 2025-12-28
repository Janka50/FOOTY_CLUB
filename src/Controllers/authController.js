const jwt = require('jsonwebtoken');
const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const ApiResponse = require('../Utils/ApiResponse');
const { User, Session } = require('../models');

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Register new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, accountType } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    where: { email }
  });

  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  // Check username
  const existingUsername = await User.findOne({
    where: { username }
  });

  if (existingUsername) {
    throw ApiError.conflict('Username already taken');
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    fullName,
    accountType: accountType || 'fan'
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Create session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await Session.create({
    userId: user.id,
    token: accessToken,
    refreshToken,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    expiresAt
  });

  // Return response
  res.status(201).json(
    new ApiResponse(201, {
      user: user.toPublicJSON(),
      accessToken,
      refreshToken
    }, 'User registered successfully')
  );
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findOne({
    where: { email },
    attributes: { include: ['password'] }
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw ApiError.forbidden('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Create session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await Session.create({
    userId: user.id,
    token: accessToken,
    refreshToken,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    expiresAt
  });

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Return response
  res.status(200).json(
    new ApiResponse(200, {
      user: user.toPublicJSON(),
      accessToken,
      refreshToken
    }, 'Login successful')
  );
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // Delete session
  await req.session.destroy();

  res.status(200).json(
    new ApiResponse(200, null, 'Logout successful')
  );
});

/**
 * Get current user
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, req.user.toPublicJSON(), 'User retrieved successfully')
  );
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw ApiError.badRequest('Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find session
    const session = await Session.findOne({
      where: { refreshToken, userId: decoded.userId }
    });

    if (!session) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens(decoded.userId);

    // Update session
    session.token = tokens.accessToken;
    session.refreshToken = tokens.refreshToken;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    session.expiresAt = expiresAt;
    await session.save();

    res.status(200).json(
      new ApiResponse(200, tokens, 'Token refreshed successfully')
    );
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    throw error;
  }
});

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken
};