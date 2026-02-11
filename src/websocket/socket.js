const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

let io;

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io/'
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        // Allow anonymous connections (read-only)
        socket.user = null;
        return next();
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user
      const user = await User.findByPk(decoded.userId);
      
      if (!user || !user.isActive) {
        return next(new Error('Invalid token'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    
    if (socket.user) {
      logger.info(`User connected: ${socket.user.username}`);
    }

    // Join a match room to receive updates
    socket.on('join_match', (matchId) => {
      const room = `match_${matchId}`;
      socket.join(room);
      logger.info(`Socket ${socket.id} joined match room: ${room}`);
      
      socket.emit('joined_match', { 
        matchId, 
        message: `Joined match ${matchId} updates` 
      });
    });

    // Leave a match room
    socket.on('leave_match', (matchId) => {
      const room = `match_${matchId}`;
      socket.leave(room);
      logger.info(`Socket ${socket.id} left match room: ${room}`);
    });

    // Join league room for all matches in a league
    socket.on('join_league', (leagueId) => {
      const room = `league_${leagueId}`;
      socket.join(room);
      logger.info(`Socket ${socket.id} joined league room: ${room}`);
    });

    // Leave league room
    socket.on('leave_league', (leagueId) => {
      const room = `league_${leagueId}`;
      socket.leave(room);
      logger.info(`Socket ${socket.id} left league room: ${room}`);
    });

    // Disconnect event
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  logger.info('✓ WebSocket server initialized');
  return io;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Emit match update to all clients watching that match
 */
const emitMatchUpdate = (matchId, eventType, data) => {
  if (!io) return;

  const room = `match_${matchId}`;
  
  io.to(room).emit('match_update', {
    matchId,
    eventType,
    data,
    timestamp: new Date()
  });

  logger.info(`Emitted ${eventType} to match room: ${room}`);
};

/**
 * Emit match score update
 */
const emitScoreUpdate = (matchId, homeScore, awayScore) => {
  emitMatchUpdate(matchId, 'score_update', {
    homeScore,
    awayScore
  });
};

/**
 * Emit match event (goal, card, substitution)
 */
const emitMatchEvent = (matchId, event) => {
  emitMatchUpdate(matchId, 'match_event', event);
};

/**
 * Emit match status change (live, finished, etc.)
 */
const emitMatchStatus = (matchId, status, currentMinute = null) => {
  emitMatchUpdate(matchId, 'status_change', {
    status,
    currentMinute
  });
};

/**
 * Emit to all clients in a league
 */
const emitToLeague = (leagueId, eventType, data) => {
  if (!io) return;

  const room = `league_${leagueId}`;
  
  io.to(room).emit('league_update', {
    leagueId,
    eventType,
    data,
    timestamp: new Date()
  });

  logger.info(`Emitted ${eventType} to league room: ${room}`);
};

module.exports = {
  initializeSocket,
  getIO,
  emitMatchUpdate,
  emitScoreUpdate,
  emitMatchEvent,
  emitMatchStatus,
  emitToLeague
};