const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const ApiResponse = require('../Utils/ApiResponse');
const { Match, Team, League, MatchEvent, Player } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all matches with filtering
 * GET /api/matches?status=live&league=1&team=1&date=2024-12-20
 */
const getMatches = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status,
    league,
    team,
    date,
    upcoming,
    live
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Filter by league
  if (league) {
    where.leagueId = league;
  }

  // Filter by team (home or away)
  if (team) {
    where[Op.or] = [
      { homeTeamId: team },
      { awayTeamId: team }
    ];
  }

  // Filter by date
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    where.matchDate = {
      [Op.between]: [startOfDay, endOfDay]
    };
  }

  // Show only upcoming matches
  if (upcoming === 'true') {
    where.status = 'scheduled';
    where.matchDate = { [Op.gt]: new Date() };
  }

  // Show only live matches
  if (live === 'true') {
    where.status = 'live';
  }

  const { rows: matches, count } = await Match.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['matchDate', 'DESC']],
    include: [
      {
        model: League,
        as: 'league',
        attributes: ['id', 'name', 'country']
      },
      {
        model: Team,
        as: 'homeTeam',
        attributes: ['id', 'name', 'shortName', 'logoUrl']
      },
      {
        model: Team,
        as: 'awayTeam',
        attributes: ['id', 'name', 'shortName', 'logoUrl']
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, {
      matches,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Matches retrieved successfully')
  );
});

/**
 * Get single match by ID with full details
 * GET /api/matches/:id
 */
const getMatchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const match = await Match.findByPk(id, {
    include: [
      {
        model: League,
        as: 'league',
        attributes: ['id', 'name', 'country', 'logoUrl']
      },
      {
        model: Team,
        as: 'homeTeam',
        attributes: ['id', 'name', 'shortName', 'logoUrl', 'stadium']
      },
      {
        model: Team,
        as: 'awayTeam',
        attributes: ['id', 'name', 'shortName', 'logoUrl']
      },
      {
        model: MatchEvent,
        as: 'events',
        include: [
          {
            model: Player,
            as: 'player',
            attributes: ['id', 'name', 'position', 'jerseyNumber']
          },
          {
            model: Player,
            as: 'playerOut',
            attributes: ['id', 'name', 'jerseyNumber']
          },
          {
            model: Player,
            as: 'playerIn',
            attributes: ['id', 'name', 'jerseyNumber']
          }
        ],
        order: [['minute', 'ASC']]
      }
    ]
  });

  if (!match) {
    throw ApiError.notFound('Match not found');
  }

  res.status(200).json(
    new ApiResponse(200, match, 'Match retrieved successfully')
  );
});

/**
 * Create new match
 * POST /api/matches
 */
const createMatch = asyncHandler(async (req, res) => {
  const {
    leagueId,
    homeTeamId,
    awayTeamId,
    matchDate,
    venue,
    matchWeek,
    season,
    referee
  } = req.body;

  // Validate teams exist
  const homeTeam = await Team.findByPk(homeTeamId);
  const awayTeam = await Team.findByPk(awayTeamId);

  if (!homeTeam) {
    throw ApiError.notFound('Home team not found');
  }

  if (!awayTeam) {
    throw ApiError.notFound('Away team not found');
  }

  // Validate league if provided
  if (leagueId) {
    const league = await League.findByPk(leagueId);
    if (!league) {
      throw ApiError.notFound('League not found');
    }
  }

  // Ensure teams are different
  if (homeTeamId === awayTeamId) {
    throw ApiError.badRequest('Home team and away team must be different');
  }

  const match = await Match.create({
    leagueId,
    homeTeamId,
    awayTeamId,
    matchDate: new Date(matchDate),
    venue: venue || homeTeam.stadium,
    status: 'scheduled',
    matchWeek,
    season,
    referee,
    homeScore: 0,
    awayScore: 0
  });

  // Reload with relationships
  await match.reload({
    include: [
      {
        model: League,
        as: 'league',
        attributes: ['id', 'name']
      },
      {
        model: Team,
        as: 'homeTeam',
        attributes: ['id', 'name', 'logoUrl']
      },
      {
        model: Team,
        as: 'awayTeam',
        attributes: ['id', 'name', 'logoUrl']
      }
    ]
  });

  res.status(201).json(
    new ApiResponse(201, match, 'Match created successfully')
  );
});

/**
 * Update match
 * PUT /api/matches/:id
 */
const updateMatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    matchDate,
    venue,
    status,
    homeScore,
    awayScore,
    halfTimeHomeScore,
    halfTimeAwayScore,
    attendance,
    referee,
    currentMinute
  } = req.body;

  const match = await Match.findByPk(id);

  if (!match) {
    throw ApiError.notFound('Match not found');
  }

  // Update fields
  if (matchDate !== undefined) match.matchDate = new Date(matchDate);
  if (venue !== undefined) match.venue = venue;
  if (status !== undefined) match.status = status;
  if (homeScore !== undefined) match.homeScore = homeScore;
  if (awayScore !== undefined) match.awayScore = awayScore;
  if (halfTimeHomeScore !== undefined) match.halfTimeHomeScore = halfTimeHomeScore;
  if (halfTimeAwayScore !== undefined) match.halfTimeAwayScore = halfTimeAwayScore;
  if (attendance !== undefined) match.attendance = attendance;
  if (referee !== undefined) match.referee = referee;
  if (currentMinute !== undefined) match.currentMinute = currentMinute;

  await match.save();

  // Reload with relationships
  await match.reload({
    include: [
      {
        model: League,
        as: 'league'
      },
      {
        model: Team,
        as: 'homeTeam'
      },
      {
        model: Team,
        as: 'awayTeam'
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, match, 'Match updated successfully')
  );
});

/**
 * Delete match
 * DELETE /api/matches/:id
 */
const deleteMatch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const match = await Match.findByPk(id);

  if (!match) {
    throw ApiError.notFound('Match not found');
  }

  // Can't delete finished matches (to preserve history)
  if (match.status === 'finished') {
    throw ApiError.badRequest('Cannot delete finished matches. Set to cancelled instead.');
  }

  await match.destroy();

  res.status(200).json(
    new ApiResponse(200, null, 'Match deleted successfully')
  );
});

/**
 * Get live matches
 * GET /api/matches/live
 */
const getLiveMatches = asyncHandler(async (req, res) => {
  const matches = await Match.findAll({
    where: { status: 'live' },
    order: [['matchDate', 'ASC']],
    include: [
      {
        model: League,
        as: 'league',
        attributes: ['id', 'name', 'logoUrl']
      },
      {
        model: Team,
        as: 'homeTeam',
        attributes: ['id', 'name', 'shortName', 'logoUrl']
      },
      {
        model: Team,
        as: 'awayTeam',
        attributes: ['id', 'name', 'shortName', 'logoUrl']
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, matches, 'Live matches retrieved successfully')
  );
});

/**
 * Get upcoming matches
 * GET /api/matches/upcoming?limit=10
 */
const getUpcomingMatches = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const matches = await Match.findAll({
    where: {
      status: 'scheduled',
      matchDate: { [Op.gt]: new Date() }
    },
    limit: parseInt(limit),
    order: [['matchDate', 'ASC']],
    include: [
      {
        model: League,
        as: 'league',
        attributes: ['id', 'name', 'logoUrl']
      },
      {
        model: Team,
        as: 'homeTeam',
        attributes: ['id', 'name', 'shortName', 'logoUrl']
      },
      {
        model: Team,
        as: 'awayTeam',
        attributes: ['id', 'name', 'shortName', 'logoUrl']
      }
    ]
  });

  res.status(200).json(
    new ApiResponse(200, matches, 'Upcoming matches retrieved successfully')
  );
});

/**
 * Add match event (goal, card, substitution)
 * POST /api/matches/:id/events
 */
const addMatchEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    teamId,
    playerId,
    eventType,
    minute,
    extraTimeMinute,
    description,
    playerOutId,
    playerInId
  } = req.body;

  const match = await Match.findByPk(id);

  if (!match) {
    throw ApiError.notFound('Match not found');
  }

  // Verify team is part of this match
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw ApiError.badRequest('Team is not part of this match');
  }

  // Create event
  const event = await MatchEvent.create({
    matchId: id,
    teamId,
    playerId,
    eventType,
    minute,
    extraTimeMinute,
    description,
    playerOutId,
    playerInId
  });

  // Update match score if goal
  if (eventType === 'goal' || eventType === 'penalty' || eventType === 'own_goal') {
    if (teamId === match.homeTeamId) {
      match.homeScore += 1;
    } else {
      match.awayScore += 1;
    }
    await match.save();
  }

  // Reload event with relationships
  await event.reload({
    include: [
      {
        model: Player,
        as: 'player',
        attributes: ['id', 'name', 'jerseyNumber']
      }
    ]
  });

  res.status(201).json(
    new ApiResponse(201, {
      event,
      match: {
        id: match.id,
        homeScore: match.homeScore,
        awayScore: match.awayScore
      }
    }, 'Match event added successfully')
  );
});

module.exports = {
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  getLiveMatches,
  getUpcomingMatches,
  addMatchEvent
};