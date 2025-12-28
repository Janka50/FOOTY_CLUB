const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const ApiResponse = require('../Utils/ApiResponse');
const { League, Team } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all leagues with filtering and pagination
 * GET /api/leagues?page=1&limit=10&country=England&type=major
 */
const getLeagues = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    country, 
    leagueType,
    search 
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Apply filters
  if (country) {
    where.country = country;
  }

  if (leagueType) {
    where.leagueType = leagueType;
  }

  if (search) {
    where.name = {
      [Op.iLike]: `%${search}%` // Case-insensitive search
    };
  }

  // Only show active leagues by default
  if (req.query.includeInactive !== 'true') {
    where.isActive = true;
  }

  const { rows: leagues, count } = await League.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['name', 'ASC']],
    include: [{
      model: Team,
      as: 'teams',
      attributes: ['id', 'name', 'logoUrl']
    }]
  });

  res.status(200).json(
    new ApiResponse(200, {
      leagues,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Leagues retrieved successfully')
  );
});

/**
 * Get single league by ID
 * GET /api/leagues/:id
 */
const getLeagueById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const league = await League.findByPk(id, {
    include: [{
      model: Team,
      as: 'teams',
      attributes: ['id', 'name', 'shortName', 'logoUrl', 'stadium', 'city']
    }]
  });

  if (!league) {
    throw ApiError.notFound('League not found');
  }

  res.status(200).json(
    new ApiResponse(200, league, 'League retrieved successfully')
  );
});

/**
 * Create new league
 * POST /api/leagues
 */
const createLeague = asyncHandler(async (req, res) => {
  const {
    name,
    country,
    leagueType,
    logoUrl,
    description,
    foundedYear,
    currentSeason
  } = req.body;

  // Check if league already exists
  const existingLeague = await League.findOne({
    where: { name, country }
  });

  if (existingLeague) {
    throw ApiError.conflict('League with this name already exists in this country');
  }

  const league = await League.create({
    name,
    country,
    leagueType,
    logoUrl,
    description,
    foundedYear,
    currentSeason,
    isActive: true
  });

  res.status(201).json(
    new ApiResponse(201, league, 'League created successfully')
  );
});

/**
 * Update league
 * PUT /api/leagues/:id
 */
const updateLeague = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    country,
    leagueType,
    logoUrl,
    description,
    foundedYear,
    currentSeason,
    isActive
  } = req.body;

  const league = await League.findByPk(id);

  if (!league) {
    throw ApiError.notFound('League not found');
  }

  // Update fields if provided
  if (name !== undefined) league.name = name;
  if (country !== undefined) league.country = country;
  if (leagueType !== undefined) league.leagueType = leagueType;
  if (logoUrl !== undefined) league.logoUrl = logoUrl;
  if (description !== undefined) league.description = description;
  if (foundedYear !== undefined) league.foundedYear = foundedYear;
  if (currentSeason !== undefined) league.currentSeason = currentSeason;
  if (isActive !== undefined) league.isActive = isActive;

  await league.save();

  res.status(200).json(
    new ApiResponse(200, league, 'League updated successfully')
  );
});

/**
 * Delete league
 * DELETE /api/leagues/:id
 */
const deleteLeague = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const league = await League.findByPk(id);

  if (!league) {
    throw ApiError.notFound('League not found');
  }

  // Check if league has teams
  const teamsCount = await Team.count({
    where: { leagueId: id }
  });

  if (teamsCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete league with ${teamsCount} teams. Remove teams first or set league to inactive.`
    );
  }

  await league.destroy();

  res.status(200).json(
    new ApiResponse(200, null, 'League deleted successfully')
  );
});

/**
 * Get league standings (teams sorted by points/wins)
 * GET /api/leagues/:id/standings
 */
const getLeagueStandings = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const league = await League.findByPk(id);

  if (!league) {
    throw ApiError.notFound('League not found');
  }

  const teams = await Team.findAll({
    where: { leagueId: id },
    attributes: ['id', 'name', 'shortName', 'logoUrl'],
    order: [['name', 'ASC']]
  });

  res.status(200).json(
    new ApiResponse(200, {
      league: {
        id: league.id,
        name: league.name,
        season: league.currentSeason
      },
      teams
    }, 'League standings retrieved successfully')
  );
});

module.exports = {
  getLeagues,
  getLeagueById,
  createLeague,
  updateLeague,
  deleteLeague,
  getLeagueStandings
};