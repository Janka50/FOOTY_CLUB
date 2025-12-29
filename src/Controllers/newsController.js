const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const ApiResponse = require('../Utils/ApiResponse');
const { News, NewsSource, User, Team, Comment } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all news with filtering and pagination
 * GET /api/news?page=1&limit=10&category=transfer&breaking=true&team=1
 */
const getAllNews = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    category,
    breaking,
    newsType,
    team,
    search,
    author
  } = req.query;

  const offset = (page - 1) * limit;
  const where = { isPublished: true };

  // Apply filters
  if (category) {
    where.category = category;
  }

  if (breaking !== undefined) {
    where.isBreaking = breaking === 'true';
  }

  if (newsType) {
    where.newsType = newsType;
  }

  // Fix: Only add author filter if it's a valid UUID
  if (author) {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(author)) {
      where.authorId = author;
    }
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { summary: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Filter by related team
  const include = [
    {
      model: NewsSource,
      as: 'source',
      attributes: ['id', 'name', 'sourceType', 'logoUrl']
    },
    {
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'fullName', 'avatarUrl']
    },
    {
      model: Team,
      as: 'relatedTeams',
      attributes: ['id', 'name', 'logoUrl'],
      through: { attributes: [] }
    }
  ];

  if (team) {
    include[2].where = { id: team };
    include[2].required = true;
  }

  const { rows: news, count } = await News.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['publishedAt', 'DESC']],
    include,
    distinct: true
  });

  res.status(200).json(
    new ApiResponse(200, {
      news,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'News retrieved successfully')
  );
});
 /** Get single news article by slug or ID
 * GET /api/news/:identifier (slug or id)
 **/
/**
 * Get single news article by slug or ID
 * GET /api/news/:identifier (slug or id)
 */
const getNewsById = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  // Check if identifier is a number (ID) or string (slug)
  const isId = !isNaN(identifier);
  let news;

  if (isId) {
    // Query by ID (integer)
    news = await News.findByPk(identifier, {
      where: { isPublished: true },
      include: [
        {
          model: NewsSource,
          as: 'source',
          attributes: ['id', 'name', 'sourceType', 'logoUrl', 'url']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'avatarUrl', 'bio']
        },
        {
          model: Team,
          as: 'relatedTeams',
          attributes: ['id', 'name', 'shortName', 'logoUrl'],
          through: { attributes: [] }
        },
        {
          model: Comment,
          as: 'comments',
          separate:true,
          where: { isDeleted: false, parentCommentId: null },
          required: false,
          limit: 5,
          order: [['created_at', 'DESC']],
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
  } else {
    // Query by slug (string)
    news = await News.findOne({
      where: { 
        slug: identifier,
        isPublished: true 
      },
      include: [
        {
          model: NewsSource,
          as: 'source',
          attributes: ['id', 'name', 'sourceType', 'logoUrl', 'url']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'avatarUrl', 'bio']
        },
        {
          model: Team,
          as: 'relatedTeams',
          attributes: ['id', 'name', 'shortName', 'logoUrl'],
          through: { attributes: [] }
        },
        {
          model: Comment,
          as: 'comments',
          separate: true,
          where: { isDeleted: false, parentCommentId: null },
          required: false,
          limit: 5,
          order: [['created_at', 'DESC']],
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
  }

  if (!news) {
    throw ApiError.notFound('News article not found');
  }

  // Check if published
  if (!news.isPublished && req.user?.id !== news.authorId && req.user?.accountType !== 'admin') {
    throw ApiError.notFound('News article not found');
  }

  // Increment view count
  await news.increment('viewCount');

  res.status(200).json(
    new ApiResponse(200, news, 'News article retrieved successfully')
  );
});
/**
 * Create new news article
 * POST /api/news
 */
const createNews = asyncHandler(async (req, res) => {
  const {
    sourceId,
    title,
    content,
    summary,
    featuredImageUrl,
    category,
    newsType,
    externalUrl,
    relatedTeams,
    isBreaking,
    metaDescription,
    metaKeywords
  } = req.body;

  // Verify source exists if provided
  if (sourceId) {
    const source = await NewsSource.findByPk(sourceId);
    if (!source) {
      throw ApiError.notFound('News source not found');
    }
  }

  // Generate slug from title
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const slug = `${baseSlug}-${Date.now()}`;

  // Create news article
  const news = await News.create({
    sourceId,
    authorId: req.user.id,
    title,
    slug,
    content,
    summary,
    featuredImageUrl,
    category,
    newsType: newsType || 'original',
    externalUrl,
    isBreaking: isBreaking || false,
    isPublished: true,
    publishedAt: new Date(),
    metaDescription,
    metaKeywords
  });

  // Add related teams if provided
  if (relatedTeams && relatedTeams.length > 0) {
    await news.addRelatedTeams(relatedTeams);
  }

  // Reload with relationships
  await news.reload({
    include: [
      {
        model: NewsSource,
        as: 'source'
      },
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'fullName']
      },
      {
        model: Team,
        as: 'relatedTeams',
        attributes: ['id', 'name', 'logoUrl'],
        through: { attributes: [] }
      }
    ]
  });

  res.status(201).json(
    new ApiResponse(201, news, 'News article created successfully')
  );
});

/**
 * Update news article
 * PUT /api/news/:id
 */
const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    content,
    summary,
    featuredImageUrl,
    category,
    isBreaking,
    isPublished,
    relatedTeams,
    metaDescription,
    metaKeywords
  } = req.body;

  const news = await News.findByPk(id);

  if (!news) {
    throw ApiError.notFound('News article not found');
  }

  // Check permissions
  const isAuthor = news.authorId === req.user.id;
  const isAdmin = req.user.accountType === 'admin';

  if (!isAuthor && !isAdmin) {
    throw ApiError.forbidden('You do not have permission to update this article');
  }

  // Update fields
  if (title !== undefined) {
    news.title = title;
    // Regenerate slug if title changed
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    news.slug = `${baseSlug}-${Date.now()}`;
  }
  if (content !== undefined) news.content = content;
  if (summary !== undefined) news.summary = summary;
  if (featuredImageUrl !== undefined) news.featuredImageUrl = featuredImageUrl;
  if (category !== undefined) news.category = category;
  if (isBreaking !== undefined) news.isBreaking = isBreaking;
  if (isPublished !== undefined) news.isPublished = isPublished;
  if (metaDescription !== undefined) news.metaDescription = metaDescription;
  if (metaKeywords !== undefined) news.metaKeywords = metaKeywords;

  await news.save();

  // Update related teams if provided
  if (relatedTeams !== undefined) {
    await news.setRelatedTeams(relatedTeams);
  }

  // Reload with relationships
  await news.reload({
    include: [
      {
        model: NewsSource,
        as: 'source'
      },
      {
        model: User,
        as: 'author'
      },
      {
        model: Team,
        as: 'relatedTeams',
        through: { attributes: [] }
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, news, 'News article updated successfully')
  );
});

/**
 * Delete news article
 * DELETE /api/news/:id
 */
const deleteNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const news = await News.findByPk(id);

  if (!news) {
    throw ApiError.notFound('News article not found');
  }

  // Check permissions
  const isAuthor = news.authorId === req.user.id;
  const isAdmin = req.user.accountType === 'admin';

  if (!isAuthor && !isAdmin) {
    throw ApiError.forbidden('You do not have permission to delete this article');
  }

  await news.destroy();

  res.status(200).json(
    new ApiResponse(200, null, 'News article deleted successfully')
  );
});

/**
 * Get trending/popular news
 * GET /api/news/trending?limit=10
 */
const getTrendingNews = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const news = await News.findAll({
    where: { isPublished: true },
    limit: parseInt(limit),
    order: [
      ['viewCount', 'DESC'],
      ['publishedAt', 'DESC']
    ],
    include: [
      {
        model: NewsSource,
        as: 'source',
        attributes: ['id', 'name', 'logoUrl']
      },
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      },
      {
        model: Team,
        as: 'relatedTeams',
        attributes: ['id', 'name', 'logoUrl'],
        through: { attributes: [] }
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, news, 'Trending news retrieved successfully')
  );
});

/**
 * Get breaking news
 * GET /api/news/breaking
 */
const getBreakingNews = asyncHandler(async (req, res) => {
  const news = await News.findAll({
    where: { 
      isPublished: true,
      isBreaking: true
    },
    limit: 5,
    order: [['publishedAt', 'DESC']],
    include: [
      {
        model: NewsSource,
        as: 'source',
        attributes: ['id', 'name', 'logoUrl']
      },
      {
        model: Team,
        as: 'relatedTeams',
        attributes: ['id', 'name', 'logoUrl'],
        through: { attributes: [] }
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, news, 'Breaking news retrieved successfully')
  );
});

module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getTrendingNews,
  getBreakingNews
};