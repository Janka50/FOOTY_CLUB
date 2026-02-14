const express = require('express');
const { authenticate, authorize } = require('../Middlewares/auth');
const { emitMatchUpdate, emitScoreUpdate } = require('../websocket/socket');
const ApiResponse = require('../Utils/ApiResponse');

const router = express.Router();

/**
 * @route   POST /api/websocket/test/match-update
 * @desc    Test WebSocket match update emission (Admin only)
 * @access  Private (Admin)
 */
router.post('/test/match-update', authenticate, authorize('admin'), (req, res) => {
  const { matchId, eventType, data } = req.body;

  emitMatchUpdate(matchId, eventType, data);

  res.status(200).json(
    new ApiResponse(200, { 
      matchId, 
      eventType, 
      emitted: true 
    }, 'WebSocket event emitted successfully')
  );
});

/**
 * @route   POST /api/websocket/test/score
 * @desc    Test WebSocket score update (Admin only)
 * @access  Private (Admin)
 */
router.post('/test/score', authenticate, authorize('admin'), (req, res) => {
  const { matchId, homeScore, awayScore } = req.body;

  emitScoreUpdate(matchId, homeScore, awayScore);

  res.status(200).json(
    new ApiResponse(200, { 
      matchId, 
      homeScore, 
      awayScore, 
      emitted: true 
    }, 'Score update emitted successfully')
  );
});

module.exports = router;