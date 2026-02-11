// At the top, add:
const Match = require("../models/Match");
const League = require("../models/League");
const Team = require("../models/Team");
const MatchEvent = require("../models/MatchEvent");
const Player = require("../models/Player");
const ApiError = require("../Utils/ApiError");
const ApiResponse = require("../Utils/ApiResponse");


const { 
  emitScoreUpdate, 
  emitMatchEvent, 
  emitMatchStatus 
} = require('../websocket/socket');

// In the updateMatch function, add after saving:
const asyncHandler = require("express-async-handler");
const { getTeamMatches } = require("./teamController");
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

  // Track changes for WebSocket emissions
  const statusChanged = status && status !== match.status;
  const scoreChanged = (homeScore !== undefined && homeScore !== match.homeScore) || 
                       (awayScore !== undefined && awayScore !== match.awayScore);

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

  // Emit WebSocket events
  if (scoreChanged) {
    emitScoreUpdate(match.id, match.homeScore, match.awayScore);
  }

  if (statusChanged) {
    emitMatchStatus(match.id, match.status, match.currentMinute);
  }

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

// In the addMatchEvent function, add after creating event:
const addMatchEvent = asyncHandler(async (req, res) => {
  // ... existing code ...

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

    // Emit score update via WebSocket
    emitScoreUpdate(match.id, match.homeScore, match.awayScore);
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

  // Emit match event via WebSocket
  emitMatchEvent(match.id, {
    eventType,
    minute,
    teamId,
    player: event.player,
    description,
    homeScore: match.homeScore,
    awayScore: match.awayScore
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
const getMatches = async (req, res) => {
  res.json({ message: "getMatches not implemented yet" });
};

const getMatchById = async (req, res) => {
  res.json({ message: "getMatchById not implemented yet" });
};

const createMatch = async (req, res) => {
  res.json({ message: "createMatch not implemented yet" });
};

const deleteMatch = async (req, res) => {
  res.json({ message: "deleteMatch not implemented yet" });
};

const getLiveMatches = async (req, res) => {
  res.json({ message: "getLiveMatches not implemented yet" });
};

const getUpcomingMatches = async (req, res) => {
  res.json({ message: "getUpcomingMatches not implemented yet" });
};

module.exports = {
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  getLiveMatches,
  getUpcomingMatches,
  addMatchEvent,
  getTeamMatches
};