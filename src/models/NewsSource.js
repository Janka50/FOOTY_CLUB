const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NewsSource = sequelize.define('NewsSource', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  sourceType: {
    type: DataTypes.ENUM('official', 'media', 'social'),
    allowNull: false,
    field: 'source_type'
  },
  url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  logoUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'logo_url'
  },
  apiConfig: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'api_config'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'news_sources',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['source_type'] },
    { fields: ['is_active'] }
  ]
});

module.exports = NewsSource;