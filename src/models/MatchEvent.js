const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MatchEvent = sequelize.define('MatchEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  matchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'match_id',
    references: {
      model: 'matches',
      key: 'id'
    }
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'team_id',
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  playerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'player_id',
    references: {
      model: 'team_players',
      key: 'id'
    }
  },
  eventType: {
    type: DataTypes.ENUM('goal', 'yellow_card', 'red_card', 'substitution', 'penalty', 'own_goal'),
    allowNull: false,
    field: 'event_type'
  },
  minute: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 120
    }
  },
  extraTimeMinute: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'extra_time_minute',
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  playerOutId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'player_out_id',
    references: {
      model: 'team_players',
      key: 'id'
    }
  },
  playerInId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'player_in_id',
    references: {
      model: 'team_players',
      key: 'id'
    }
  }
}, {
  tableName: 'match_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['match_id'] },
    { fields: ['event_type'] },
    { fields: ['match_id', 'minute'] }
  ]
});

module.exports = MatchEvent;