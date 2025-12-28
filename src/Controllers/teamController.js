const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const ApiResponse = require('../Utils/ApiResponse');
const { Team, League, User, Player, Match } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all teams with filtering and pagination
 * GET /api/teams?page=1&limit=10&league=1&country=England&search=Manchester
 */
const getTeams = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    league,
    country,
    verified,
    search 
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Apply filters
  if (league) {
    where.leagueId = league;
  }

  if (country) {
    where.country = country;
  }

  if (verified !== undefined) {
    where.isVerified = verified === 'true';
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { shortName: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { rows: teams, count } = await Team.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['name', 'ASC']],
    include: [
      {
        model: League,
        as: 'league',
        attributes: ['id', 'name', 'country', 'leagueType']
      },
      {
        model: User,
        as: 'account',
        attributes: ['id', 'username', 'email', 'isVerified']
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, {
      teams,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Teams retrieved successfully')
  );
});

/**
 * Get single team by ID with full details
 * GET /api/teams/:id
 */
const getTeamById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const team = await Team.findByPk(id, {
    include: [
      {
        model: League,
        as: 'league',
        attributes: ['id', 'name', 'country', 'logoUrl']
      },
      {
        model: User,
        as: 'account',
        attributes: ['id', 'username', 'isVerified']
      },
      {
        model: Player,
        as: 'players',
        where: { isActive: true },
        required: false,
        order: [['jerseyNumber', 'ASC']]
      }
    ]
  });

  if (!team) {
    throw ApiError.notFound('Team not found');
  }

  res.status(200).json(
    new ApiResponse(200, team, 'Team retrieved successfully')
  );
});

/**
 * Create new team
 * POST /api/teams
 */
const createTeam = asyncHandler(async (req, res) => {
  const {
    leagueId,
    name,
    shortName,
    logoUrl,
    stadium,
    foundedYear,
    country,
    city,
    description,
    officialWebsite,
    socialMedia
  } = req.body;

  // Check if team already exists
  const existingTeam = await Team.findOne({
    where: { name, country }
  });

  if (existingTeam) {
    throw ApiError.conflict('Team with this name already exists in this country');
  }

  // Verify league exists if provided
  if (leagueId) {
    const league = await League.findByPk(leagueId);
    if (!league) {
      throw ApiError.notFound('League not found');
    }
  }

  // Link to user account if user is a team account
  let userId = null;
  if (req.user.accountType === 'team' && !req.user.teamProfile) {
    userId = req.user.id;
  }

  const team = await Team.create({
    leagueId,
    userId,
    name,
    shortName,
    logoUrl,
    stadium,
    foundedYear,
    country,
    city,
    description,
    officialWebsite,
    socialMedia,
    isVerified: req.user.accountType === 'admin' ? true : false
  });

  // Load relationships
  await team.reload({
    include: [
      {
        model: League,
        as: 'league',
        attributes: ['id', 'name']
      }
    ]
  });

  res.status(201).json(
    new ApiResponse(201, team, 'Team created successfully')
  );
});

/**
 * Update team
 * PUT /api/teams/:id
 */
const updateTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    leagueId,
    name,
    shortName,
    logoUrl,
    stadium,
    foundedYear,
    country,
    city,
    description,
    officialWebsite,
    socialMedia,
    isVerified
  } = req.body;

  const team = await Team.findByPk(id);

  if (!team) {
    throw ApiError.notFound('Team not found');
  }

  // Check permissions
  const isOwner = team.userId && team.userId === req.user.id;
  const isAdmin = req.user.accountType === 'admin';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('You do not have permission to update this team');
  }

  // Verify league exists if updating
  if (leagueId && leagueId !== team.leagueId) {
    const league = await League.findByPk(leagueId);
    if (!league) {
      throw ApiError.notFound('League not found');
    }
  }

  // Update fields
  if (leagueId !== undefined) team.leagueId = leagueId;
  if (name !== undefined) team.name = name;
  if (shortName !== undefined) team.shortName = shortName;
  if (logoUrl !== undefined) team.logoUrl = logoUrl;
  if (stadium !== undefined) team.stadium = stadium;
  if (foundedYear !== undefined) team.foundedYear = foundedYear;
  if (country !== undefined) team.country = country;
  if (city !== undefined) team.city = city;
  if (description !== undefined) team.description = description;
  if (officialWebsite !== undefined) team.officialWebsite = officialWebsite;
  if (socialMedia !== undefined) team.socialMedia = socialMedia;
  
  // Only admins can verify teams
  if (isVerified !== undefined && isAdmin) {
    team.isVerified = isVerified;
  }

  await team.save();

  // Reload with relationships
  await team.reload({
    include: [
      {
        model: League,
        as: 'league'
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, team, 'Team updated successfully')
  );
});

/**
 * Delete team
 * DELETE /api/teams/:id
 */
const deleteTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const team = await Team.findByPk(id);

  if (!team) {
    throw ApiError.notFound('Team not found');
  }

  // Check permissions
  const isOwner = team.userId && team.userId === req.user.id;
  const isAdmin = req.user.accountType === 'admin';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('You do not have permission to delete this team');
  }

  // Check if team has players
  const playersCount = await Player.count({
    where: { teamId: id }
  });

  if (playersCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete team with ${playersCount} players. Remove players first.`
    );
  }

  // Check if team has upcoming matches
  const upcomingMatches = await Match.count({
    where: {
      [Op.or]: [
        { homeTeamId: id },
        { awayTeamId: id }
      ],
      status: 'scheduled',
      matchDate: { [Op.gt]: new Date() }
    }
  });

  if (upcomingMatches > 0) {
    throw ApiError.badRequest(
      `Cannot delete team with ${upcomingMatches} upcoming matches.`
    );
  }

  await team.destroy();

  res.status(200).json(
    new ApiResponse(200, null, 'Team deleted successfully')
  );
});

/**
 * Get team's players
 * GET /api/teams/:id/players
 */
const getTeamPlayers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { position } = req.query;

  const team = await Team.findByPk(id);

  if (!team) {
    throw ApiError.notFound('Team not found');
  }

  const where = { teamId: id, isActive: true };

  if (position) {
    where.position = position;
  }

  const players = await Player.findAll({
    where,
    order: [
      ['position', 'ASC'],
      ['jerseyNumber', 'ASC']
    ]
  });

  res.status(200).json(
    new ApiResponse(200, {
      team: {
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl
      },
      players
    }, 'Team players retrieved successfully')
  );
});

/**
 * Get team's matches
 * GET /api/teams/:id/matches?status=finished&limit=10
 */
const getTeamMatches = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, limit = 10 } = req.query;

  const team = await Team.findByPk(id);

  if (!team) {
    throw ApiError.notFound('Team not found');
  }

  const where = {
    [Op.or]: [
      { homeTeamId: id },
      { awayTeamId: id }
    ]
  };

  if (status) {
    where.status = status;
  }

  const matches = await Match.findAll({
    where,
    limit: parseInt(limit),
    order: [['matchDate', 'DESC']],
    include: [
      {
        model: Team,
        as: 'homeTeam',
        attributes: ['id', 'name', 'shortName', 'logoUrl']
      },
      {
        model: Team,
        as: 'awayTeam',
        attributes: ['id', 'name', 'shortName', 'logoUrl']
      },
      {
        model: League,
        as: 'league',
        attributes: ['id', 'name']
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, {
      team: {
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl
      },
      matches
    }, 'Team matches retrieved successfully')
  );
});

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamPlayers,
  getTeamMatches
};