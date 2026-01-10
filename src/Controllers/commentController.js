const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const ApiResponse = require('../Utils/ApiResponse');
const { Comment, User, News } = require('../models');
const { sequelize } = require('../config/database');

/**
 * Get comments for a news article
 * GET /api/news/:newsId/comments
 */
const getCommentsByNewsId = asyncHandler(async (req, res) => {
  const { newsId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Verify news exists
  const news = await News.findByPk(newsId);
  if (!news) {
    throw ApiError.notFound('News article not found');
  }

  const offset = (page - 1) * limit;

  // Get top-level comments (no parent)
  const { rows: comments, count } = await Comment.findAndCountAll({
    where: {
      newsId,
      parentCommentId: null,
      isDeleted: false
    },
    limit: parseInt(limit),
    offset: parseInt(offset),
    separate: true,
    order: [['created_at', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatarUrl', 'accountType']
      },
      {
        model: Comment,
        as: 'replies',
        where: { isDeleted: false },
        required: false,
        limit: 3, // Show first 3 replies
        order: [[sequelize.col('comments.created_at'), 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatarUrl']
          }
        ]
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, {
      comments,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Comments retrieved successfully')
  );
});

/**
 * Get replies for a specific comment
 * GET /api/comments/:commentId/replies
 */
const getCommentReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Verify parent comment exists
  const parentComment = await Comment.findByPk(commentId);
  if (!parentComment) {
    throw ApiError.notFound('Comment not found');
  }

  const offset = (page - 1) * limit;

  const { rows: replies, count } = await Comment.findAndCountAll({
    where: {
      parentCommentId: commentId,
      isDeleted: false
    },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'ASC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatarUrl']
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, {
      replies,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Replies retrieved successfully')
  );
});

/**
 * Create a comment
 * POST /api/news/:newsId/comments
 */
const createComment = asyncHandler(async (req, res) => {
  const { newsId } = req.params;
  const { content, parentCommentId } = req.body;

  // Verify news exists
  const news = await News.findByPk(newsId);
  if (!news) {
    throw ApiError.notFound('News article not found');
  }

  // If replying to a comment, verify it exists
  if (parentCommentId) {
    const parentComment = await Comment.findByPk(parentCommentId);
    if (!parentComment) {
      throw ApiError.notFound('Parent comment not found');
    }

    // Ensure parent comment belongs to the same news article
    if (parentComment.newsId !== parseInt(newsId)) {
      throw ApiError.badRequest('Parent comment does not belong to this news article');
    }
  }

  // Create comment
  const comment = await Comment.create({
    newsId,
    userId: req.user.id,
    parentCommentId: parentCommentId || null,
    content,
    likesCount: 0,
    isEdited: false,
    isDeleted: false
  });

  // Reload with user data
  await comment.reload({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatarUrl']
      }
    ]
  });

  res.status(201).json(
    new ApiResponse(201, comment, 'Comment created successfully')
  );
});

/**
 * Update a comment
 * PUT /api/comments/:id
 */
const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const comment = await Comment.findByPk(id);

  if (!comment) {
    throw ApiError.notFound('Comment not found');
  }

  // Check if user owns the comment
  if (comment.userId !== req.user.id) {
    throw ApiError.forbidden('You can only edit your own comments');
  }

  // Check if comment is deleted
  if (comment.isDeleted) {
    throw ApiError.badRequest('Cannot edit deleted comment');
  }

  // Update comment
  comment.content = content;
  comment.isEdited = true;
  await comment.save();

  // Reload with user data
  await comment.reload({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, comment, 'Comment updated successfully')
  );
});

/**
 * Delete a comment
 * DELETE /api/comments/:id
 */
const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await Comment.findByPk(id);

  if (!comment) {
    throw ApiError.notFound('Comment not found');
  }

  // Check permissions (owner or admin)
  const isOwner = comment.userId === req.user.id;
  const isAdmin = req.user.accountType === 'admin';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('You do not have permission to delete this comment');
  }

  // Soft delete (mark as deleted instead of removing)
  comment.isDeleted = true;
  comment.content = '[Comment deleted]';
  await comment.save();

  res.status(200).json(
    new ApiResponse(200, null, 'Comment deleted successfully')
  );
});

/**
 * Like/Unlike a comment
 * POST /api/comments/:id/like
 */
const likeComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await Comment.findByPk(id);

  if (!comment) {
    throw ApiError.notFound('Comment not found');
  }

  if (comment.isDeleted) {
    throw ApiError.badRequest('Cannot like deleted comment');
  }

  // In a real app, you'd track who liked what in a separate table
  // For now, we'll just increment/decrement the count
  // This is simplified - you should create a comment_likes table
  
  comment.likesCount += 1;
  await comment.save();

  res.status(200).json(
    new ApiResponse(200, { likesCount: comment.likesCount }, 'Comment liked successfully')
  );
});

module.exports = {
  getCommentsByNewsId,
  getCommentReplies,
  createComment,
  updateComment,
  deleteComment,
  likeComment
};