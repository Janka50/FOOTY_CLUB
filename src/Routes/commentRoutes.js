const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../Middlewares/validation');
const { authenticate } = require('../Middlewares/auth');
const {
  getCommentsByNewsId,
  getCommentReplies,
  createComment,
  updateComment,
  deleteComment,
  likeComment
} = require('../Controllers/commentController');

const router = express.Router();

/**
 * Comment routes
 * Mounted at /api in app.js
 */

/**
 * @route   GET /api/news/:newsId/comments
 * @desc    Get comments for a news article
 * @access  Public
 */
router.get(
  '/news/:newsId/comments',
  [
    param('newsId').isInt().withMessage('Invalid news ID'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  getCommentsByNewsId
);

/**
 * @route   POST /api/news/:newsId/comments
 * @desc    Create a comment or reply
 * @access  Private
 */
router.post(
  '/news/:newsId/comments',
  authenticate,
  [
    param('newsId').isInt().withMessage('Invalid news ID'),
    body('content')
      .trim()
      .notEmpty().withMessage('Comment content is required')
      .isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
    body('parentCommentId')
      .optional()
      .isInt().withMessage('Invalid parent comment ID')
  ],
  validate,
  createComment
);

/**
 * @route   GET /api/comments/:commentId/replies
 * @desc    Get replies for a specific comment
 * @access  Public
 */
router.get(
  '/comments/:commentId/replies',
  [
    param('commentId').isInt().withMessage('Invalid comment ID'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validate,
  getCommentReplies
);

/**
 * @route   PUT /api/comments/:id
 * @desc    Update a comment
 * @access  Private
 */
router.put(
  '/comments/:id',
  authenticate,
  [
    param('id').isInt().withMessage('Invalid comment ID'),
    body('content')
      .trim()
      .notEmpty().withMessage('Comment content is required')
      .isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters')
  ],
  validate,
  updateComment
);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment
 * @access  Private
 */
router.delete(
  '/comments/:id',
  authenticate,
  [
    param('id').isInt().withMessage('Invalid comment ID')
  ],
  validate,
  deleteComment
);

/**
 * @route   POST /api/comments/:id/like
 * @desc    Like a comment
 * @access  Private
 */
router.post(
  '/comments/:id/like',
  authenticate,
  [
    param('id').isInt().withMessage('Invalid comment ID')
  ],
  validate,
  likeComment
);

module.exports = router;