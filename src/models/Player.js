const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Player = sequelize.define('Player', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  position: {
    type: DataTypes.ENUM('GK', 'DEF', 'MID', 'FWD'),
    allowNull: false
  },
  jerseyNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'jersey_number',
    validate: {
      min: 1,
      max: 99
    }
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth'
  },
  nationality: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  photoUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'photo_url'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  joinedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'joined_date'
  },
  // Player statistics
  appearances: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  goals: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  assists: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  yellowCards: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'yellow_cards'
  },
  redCards: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'red_cards'
  }
}, {
  tableName: 'team_players',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['team_id'] },
    { fields: ['position'] },
    { fields: ['is_active'] },
    { unique: true, fields: ['team_id', 'jersey_number'] }
  ]
});

module.exports = Player;