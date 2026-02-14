const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const ApiResponse = require('../Utils/ApiResponse');
const { Comment, User, News } = require('../models');

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

  // Get top-level comments only (no parent)
  const comments = await Comment.findAll({
    where: {
      newsId: parseInt(newsId),
      parentCommentId: null,
      isDeleted: false
    },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatarUrl', 'accountType']
      }
    ]
  });

  // Count total top-level comments
  const count = await Comment.count({
    where: {
      newsId: parseInt(newsId),
      parentCommentId: null,
      isDeleted: false
    }
  });

  // Get reply count for each comment
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replyCount = await Comment.count({
        where: {
          parentCommentId: comment.id,
          isDeleted: false
        }
      });

      return {
        ...comment.toJSON(),
        replyCount
      };
    })
  );

  res.status(200).json(
    new ApiResponse(200, {
      comments: commentsWithReplies,
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

  // Get replies
  const replies = await Comment.findAll({
    where: {
      parentCommentId: parseInt(commentId),
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

  // Count total replies
  const count = await Comment.count({
    where: {
      parentCommentId: parseInt(commentId),
      isDeleted: false
    }
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
    newsId: parseInt(newsId),
    userId: req.user.id,
    parentCommentId: parentCommentId ? parseInt(parentCommentId) : null,
    content,
    likesCount: 0,
    isEdited: false,
    isDeleted: false
  });

  // Get comment with user data
  const commentWithUser = await Comment.findByPk(comment.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatarUrl']
      }
    ]
  });

  res.status(201).json(
    new ApiResponse(201, commentWithUser, 'Comment created successfully')
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

  // Get updated comment with user data
  const updatedComment = await Comment.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, updatedComment, 'Comment updated successfully')
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

  // Soft delete
  comment.isDeleted = true;
  comment.content = '[Comment deleted]';
  await comment.save();

  res.status(200).json(
    new ApiResponse(200, null, 'Comment deleted successfully')
  );
});

/**
 * Like a comment
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

  // Increment like count
  comment.likesCount += 1;
  await comment.save();

  res.status(200).json(
    new ApiResponse(200, { 
      commentId: comment.id,
      likesCount: comment.likesCount 
    }, 'Comment liked successfully')
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