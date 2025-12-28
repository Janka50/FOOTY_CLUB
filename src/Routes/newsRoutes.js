const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../Middlewares/validation');
const { authenticate, authorize, optionalAuth } = require('../Middlewares/auth');
const {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getTrendingNews,
  getBreakingNews
} = require('../Controllers/newsController');

const router = express.Router();

/**
 * @route   GET /api/news/trending
 * @desc    Get trending/popular news
 * @access  Public
 */
router.get(
  '/trending',
  [
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validate,
  getTrendingNews
);

/**
 * @route   GET /api/news/breaking
 * @desc    Get breaking news
 * @access  Public
 */
router.get('/breaking', getBreakingNews);

/**
 * @route   GET /api/news
 * @desc    Get all news with filtering
 * @access  Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isIn(['transfer', 'match_report', 'interview', 'injury', 'general', 'rumor']),
    query('breaking').optional().isBoolean(),
    query('newsType').optional().isIn(['original', 'aggregated']),
    query('team').optional().isInt(),
    query('author').optional().isUUID(),
    query('search').optional().trim()
  ],
  validate,
  getAllNews
);

/**
 * @route   GET /api/news/:identifier
 * @desc    Get single news by slug or ID
 * @access  Public
 */
router.get(
  '/:identifier',
  [
    param('identifier').notEmpty().withMessage('News identifier is required')
  ],
  validate,
  getNewsById
);

/**
 * @route   POST /api/news
 * @desc    Create new news article
 * @access  Private (Admin or verified users)
 */
router.post(
  '/',
  authenticate,
  [
    body('sourceId').optional().isInt(),
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 255 }).withMessage('Title cannot exceed 255 characters'),
    body('content')
      .trim()
      .notEmpty().withMessage('Content is required'),
    body('summary')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Summary cannot exceed 500 characters'),
    body('featuredImageUrl')
      .optional()
      .isURL().withMessage('Featured image URL must be valid'),
    body('category')
      .isIn(['transfer', 'match_report', 'interview', 'injury', 'general', 'rumor'])
      .withMessage('Invalid category'),
    body('newsType')
      .optional()
      .isIn(['original', 'aggregated']),
    body('externalUrl')
      .optional()
      .isURL(),
    body('relatedTeams')
      .optional()
      .isArray(),
    body('relatedTeams.*')
      .optional()
      .isInt(),
    body('isBreaking')
      .optional()
      .isBoolean(),
    body('metaDescription')
      .optional()
      .trim()
      .isLength({ max: 160 }),
    body('metaKeywords')
      .optional()
      .isArray()
  ],
  validate,
  createNews
);

/**
 * @route   PUT /api/news/:id
 * @desc    Update news article
 * @access  Private (Author or Admin)
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isInt().withMessage('Invalid news ID'),
    body('title').optional().trim().isLength({ max: 255 }),
    body('content').optional().trim().notEmpty(),
    body('summary').optional().trim().isLength({ max: 500 }),
    body('featuredImageUrl').optional().isURL(),
    body('category').optional().isIn(['transfer', 'match_report', 'interview', 'injury', 'general', 'rumor']),
    body('isBreaking').optional().isBoolean(),
    body('isPublished').optional().isBoolean(),
    body('relatedTeams').optional().isArray(),
    body('relatedTeams.*').optional().isInt(),
    body('metaDescription').optional().trim().isLength({ max: 160 }),
    body('metaKeywords').optional().isArray()
  ],
  validate,
  updateNews
);

/**
 * @route   DELETE /api/news/:id
 * @desc    Delete news article
 * @access  Private (Author or Admin)
 */
router.delete(
  '/:id',
  authenticate,
  [
    param('id').isInt().withMessage('Invalid news ID')
  ],
  validate,
  deleteNews
);

module.exports = router;