const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../Middlewares/validation');
const { authenticate, authorize } = require('../Middlewares/auth');
const {
  getLeagues,
  getLeagueById,
  createLeague,
  updateLeague,
  deleteLeague,
  getLeagueStandings
} = require('../Controllers/leagueController');

const router = express.Router();

/**
 * @route   GET /api/leagues
 * @desc    Get all leagues with filtering
 * @access  Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('country').optional().trim(),
    query('leagueType').optional().isIn(['major', 'minor', 'regional']).withMessage('Invalid league type'),
    query('search').optional().trim()
  ],
  validate,
  getLeagues
);

/**
 * @route   GET /api/leagues/:id
 * @desc    Get single league by ID
 * @access  Public
 */
router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid league ID') // Changed from isUUID to isInt
  ],
  validate,
  getLeagueById
);

/**
 * @route   GET /api/leagues/:id/standings
 * @desc    Get league standings
 * @access  Public
 */
router.get(
  '/:id/standings',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid league ID') // Changed from isUUID to isInt
  ],
  validate,
  getLeagueStandings
);

/**
 * @route   POST /api/leagues
 * @desc    Create new league
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name')
      .trim()
      .notEmpty().withMessage('League name is required')
      .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('country')
      .trim()
      .notEmpty().withMessage('Country is required')
      .isLength({ max: 50 }).withMessage('Country cannot exceed 50 characters'),
    body('leagueType')
      .isIn(['major', 'minor', 'regional']).withMessage('League type must be major, minor, or regional'),
    body('logoUrl')
      .optional()
      .isURL().withMessage('Logo URL must be valid'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('foundedYear')
      .optional()
      .isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
    body('currentSeason')
      .optional()
      .trim()
      .isLength({ max: 20 }).withMessage('Season cannot exceed 20 characters')
  ],
  validate,
  createLeague
);

/**
 * @route   PUT /api/leagues/:id
 * @desc    Update league
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid league ID'), // Changed from isUUID to isInt
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('country')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Country cannot exceed 50 characters'),
    body('leagueType')
      .optional()
      .isIn(['major', 'minor', 'regional']).withMessage('Invalid league type'),
    body('logoUrl')
      .optional()
      .isURL().withMessage('Logo URL must be valid'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('foundedYear')
      .optional()
      .isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
    body('currentSeason')
      .optional()
      .trim()
      .isLength({ max: 20 }).withMessage('Season cannot exceed 20 characters'),
    body('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean')
  ],
  validate,
  updateLeague
);

/**
 * @route   DELETE /api/leagues/:id
 * @desc    Delete league
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid league ID') // Changed from isUUID to isInt
  ],
  validate,
  deleteLeague
);

module.exports = router;