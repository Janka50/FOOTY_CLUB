const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const League = sequelize.define('League', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  leagueType: {
    type: DataTypes.ENUM('major', 'minor', 'regional'),
    allowNull: false,
    defaultValue: 'minor',
    field: 'league_type' // ← IMPORTANT: Maps to snake_case in database
  },
  logoUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'logo_url' // ← Maps to snake_case
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  foundedYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'founded_year', // ← Maps to snake_case
    validate: {
      min: 1800,
      max: new Date().getFullYear()
    }
  },
  currentSeason: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'current_season' // ← Maps to snake_case
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active' // ← Maps to snake_case
  }
}, {
  tableName: 'leagues',
  timestamps: true, // ← IMPORTANT: Enable timestamps
  createdAt: 'created_at', // ← Map to snake_case
  updatedAt: 'updated_at', // ← Map to snake_case
  indexes: [
    { fields: ['country'] },
    { fields: ['league_type'] },
    { fields: ['is_active'] }
  ]
});

module.exports = League;