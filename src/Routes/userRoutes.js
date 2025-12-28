const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../Middlewares/validation');
const { authenticate, authorize } = require('../Middlewares/auth');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../Controllers/userController');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize('admin'), getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid user ID') // UUID is correct for users
  ],
  validate,
  getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid user ID'), // UUID is correct for users
    body('fullName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Full name cannot exceed 100 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('avatarUrl')
      .optional()
      .isURL()
      .withMessage('Avatar URL must be valid')
  ],
  validate,
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid user ID') // UUID is correct for users
  ],
  validate,
  deleteUser
);

module.exports = router;