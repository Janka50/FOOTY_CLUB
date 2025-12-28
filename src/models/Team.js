const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  leagueId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'league_id',
    references: {
      model: 'leagues',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,  // ← UUID because it references users table
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  shortName: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'short_name'
  },
  logoUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'logo_url'
  },
  stadium: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  foundedYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'founded_year',
    validate: {
      min: 1800,
      max: new Date().getFullYear()
    }
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  officialWebsite: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'official_website'
  },
  socialMedia: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'social_media'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  followersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'followers_count'
  }
}, {
  tableName: 'teams',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['league_id'] },
    { fields: ['user_id'] },
    { fields: ['country'] },
    { fields: ['is_verified'] }
  ]
});

module.exports = Team;