const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const ApiResponse = require('../Utils/ApiResponse');
const { User, Team } = require('../models');

/**
 * Get all users
 * GET /api/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, accountType } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  if (accountType) {
    where.accountType = accountType;
  }

  const { rows: users, count } = await User.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json(
    new ApiResponse(200, {
      users: users.map(u => u.toPublicJSON()),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Users retrieved successfully')
  );
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    include: [{
      model: Team,
      as: 'teamProfile'
    }]
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.status(200).json(
    new ApiResponse(200, user.toPublicJSON(), 'User retrieved successfully')
  );
});

/**
 * Update user profile
 * PUT /api/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, bio, avatarUrl } = req.body;

  // Check if user is updating their own profile or is admin
  if (req.user.id !== id && req.user.accountType !== 'admin') {
    throw ApiError.forbidden('You can only update your own profile');
  }

  const user = await User.findByPk(id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Update fields
  if (fullName !== undefined) user.fullName = fullName;
  if (bio !== undefined) user.bio = bio;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  await user.save();

  res.status(200).json(
    new ApiResponse(200, user.toPublicJSON(), 'Profile updated successfully')
  );
});

/**
 * Delete user
 * DELETE /api/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Only admins or the user themselves can delete
  if (req.user.id !== id && req.user.accountType !== 'admin') {
    throw ApiError.forbidden('Insufficient permissions');
  }

  const user = await User.findByPk(id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  await user.destroy();

  res.status(200).json(
    new ApiResponse(200, null, 'User deleted successfully')
  );
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};