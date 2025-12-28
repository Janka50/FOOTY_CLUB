console.log('matchRoutes loaded');
const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../Middlewares/validation');
const { authenticate, authorize } = require('../Middlewares/auth');
const {
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  getLiveMatches,
  getUpcomingMatches,
  addMatchEvent
} = require('../Controllers/matchController');

const router = express.Router();

/**
 * @route   GET /api/matches/live
 * @desc    Get live matches
 * @access  Public
 */
router.get('/live', getLiveMatches);

/**
 * @route   GET /api/matches/upcoming
 * @desc    Get upcoming matches
 * @access  Public
 */
router.get(
  '/upcoming',
  [
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validate,
  getUpcomingMatches
);

/**
 * @route   GET /api/matches
 * @desc    Get all matches with filtering
 * @access  Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['scheduled', 'live', 'finished', 'postponed', 'cancelled']),
    query('league').optional().isInt(),
    query('team').optional().isInt(),
    query('date').optional().isISO8601(),
    query('upcoming').optional().isBoolean(),
    query('live').optional().isBoolean()
  ],
  validate,
  getMatches
);

/**
 * @route   GET /api/matches/:id
 * @desc    Get single match by ID
 * @access  Public
 */
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid match ID')
  ],
  validate,
  getMatchById
);

/**
 * @route   POST /api/matches
 * @desc    Create new match
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('leagueId').optional().isInt(),
    body('homeTeamId').isInt().withMessage('Home team ID is required'),
    body('awayTeamId').isInt().withMessage('Away team ID is required'),
    body('matchDate').isISO8601().withMessage('Valid match date is required'),
    body('venue').optional().trim().isLength({ max: 100 }),
    body('matchWeek').optional().isInt({ min: 1 }),
    body('season').optional().trim().isLength({ max: 20 }),
    body('referee').optional().trim().isLength({ max: 100 })
  ],
  validate,
  createMatch
);

/**
 * @route   PUT /api/matches/:id
 * @desc    Update match
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt().withMessage('Invalid match ID'),
    body('matchDate').optional().isISO8601(),
    body('venue').optional().trim().isLength({ max: 100 }),
    body('status').optional().isIn(['scheduled', 'live', 'finished', 'postponed', 'cancelled']),
    body('homeScore').optional().isInt({ min: 0 }),
    body('awayScore').optional().isInt({ min: 0 }),
    body('halfTimeHomeScore').optional().isInt({ min: 0 }),
    body('halfTimeAwayScore').optional().isInt({ min: 0 }),
    body('attendance').optional().isInt({ min: 0 }),
    body('referee').optional().trim().isLength({ max: 100 }),
    body('currentMinute').optional().isInt({ min: 0, max: 120 })
  ],
  validate,
  updateMatch
);

/**
 * @route   DELETE /api/matches/:id
 * @desc    Delete match
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt().withMessage('Invalid match ID')
  ],
  validate,
  deleteMatch
);

/**
 * @route   POST /api/matches/:id/events
 * @desc    Add match event (goal, card, substitution)
 * @access  Private (Admin only)
 */
router.post(
  '/:id/events',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt().withMessage('Invalid match ID'),
    body('teamId').isInt().withMessage('Team ID is required'),
    body('playerId').optional().isInt(),
    body('eventType')
      .isIn(['goal', 'yellow_card', 'red_card', 'substitution', 'penalty', 'own_goal'])
      .withMessage('Invalid event type'),
    body('minute').isInt({ min: 0, max: 120 }).withMessage('Minute is required'),
    body('extraTimeMinute').optional().isInt({ min: 0 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('playerOutId').optional().isInt(),
    body('playerInId').optional().isInt()
  ],
  validate,
  addMatchEvent
);

module.exports = router;