const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Session = sequelize.define(
  'Session',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },

    refreshToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
      unique: true,
      field: 'refresh_token'   // ✅ map to DB
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',        // ✅ CRITICAL FIX
      references: {
        model: 'users',
        key: 'id'
      }
    },

    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address'
    },

    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    }
  },
  {
    tableName: 'sessions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['token'] },
      { fields: ['user_id'] },
      { fields: ['expires_at'] }
    ]
  }
);

module.exports = Session;
