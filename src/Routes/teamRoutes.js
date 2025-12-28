const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../Middlewares/validation');
const { authenticate, authorize, optionalAuth } = require('../Middlewares/auth');
const {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamPlayers,
  getTeamMatches
} = require('../Controllers/teamController');

const router = express.Router();

/**
 * @route   GET /api/teams
 * @desc    Get all teams with filtering
 * @access  Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('league').optional().isInt(),
    query('country').optional().trim(),
    query('verified').optional().isBoolean(),
    query('search').optional().trim()
  ],
  validate,
  getTeams
);

/**
 * @route   GET /api/teams/:id
 * @desc    Get single team by ID
 * @access  Public
 */
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid team ID')
  ],
  validate,
  getTeamById
);

/**
 * @route   GET /api/teams/:id/players
 * @desc    Get team's players
 * @access  Public
 */
router.get(
  '/:id/players',
  [
    param('id').isInt().withMessage('Invalid team ID'),
    query('position').optional().isIn(['GK', 'DEF', 'MID', 'FWD'])
  ],
  validate,
  getTeamPlayers
);

/**
 * @route   GET /api/teams/:id/matches
 * @desc    Get team's matches
 * @access  Public
 */
router.get(
  '/:id/matches',
  [
    param('id').isInt().withMessage('Invalid team ID'),
    query('status').optional().isIn(['scheduled', 'live', 'finished', 'postponed', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validate,
  getTeamMatches
);

/**
 * @route   POST /api/teams
 * @desc    Create new team
 * @access  Private (Team accounts or Admin)
 */
router.post(
  '/',
  authenticate,
  authorize('team', 'admin'),
  [
    body('leagueId')
      .optional()
      .isInt().withMessage('League ID must be an integer'),
    body('name')
      .trim()
      .notEmpty().withMessage('Team name is required')
      .isLength({ max: 100 }),
    body('shortName')
      .optional()
      .trim()
      .isLength({ max: 20 }),
    body('logoUrl')
      .optional()
      .isURL(),
    body('stadium')
      .optional()
      .trim()
      .isLength({ max: 100 }),
    body('foundedYear')
      .optional()
      .isInt({ min: 1800, max: new Date().getFullYear() }),
    body('country')
      .trim()
      .notEmpty().withMessage('Country is required'),
    body('city')
      .optional()
      .trim()
      .isLength({ max: 50 }),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }),
    body('officialWebsite')
      .optional()
      .isURL(),
    body('socialMedia')
      .optional()
      .isObject()
  ],
  validate,
  createTeam
);

/**
 * @route   PUT /api/teams/:id
 * @desc    Update team
 * @access  Private (Team owner or Admin)
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isInt().withMessage('Invalid team ID'),
    body('leagueId').optional().isInt(),
    body('name').optional().trim().isLength({ max: 100 }),
    body('shortName').optional().trim().isLength({ max: 20 }),
    body('logoUrl').optional().isURL(),
    body('stadium').optional().trim().isLength({ max: 100 }),
    body('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }),
    body('country').optional().trim().isLength({ max: 50 }),
    body('city').optional().trim().isLength({ max: 50 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('officialWebsite').optional().isURL(),
    body('socialMedia').optional().isObject(),
    body('isVerified').optional().isBoolean()
  ],
  validate,
  updateTeam
);

/**
 * @route   DELETE /api/teams/:id
 * @desc    Delete team
 * @access  Private (Team owner or Admin)
 */
router.delete(
  '/:id',
  authenticate,
  [
    param('id').isInt().withMessage('Invalid team ID')
  ],
  validate,
  deleteTeam
);

module.exports = router;