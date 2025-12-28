const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserFavorite = sequelize.define('UserFavorite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  }
}, {
  tableName: 'user_favorites',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['team_id'] },
    { unique: true, fields: ['user_id', 'team_id'] }
  ]
});

module.exports = UserFavorite;