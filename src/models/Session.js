const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Session = sequelize.define('Session', {
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
    unique: true
  },
  
    user_id: {                    // ✅ THIS WAS MISSING
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'sessions',
  indexes: [
    { fields: ['token'] },
    { fields: ['user_id'] },
    { fields: ['expires_at'] }
  ]
});

module.exports = Session;