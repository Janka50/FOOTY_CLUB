const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Match = sequelize.define('Match', {
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
  homeTeamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'home_team_id',
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  awayTeamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'away_team_id',
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  matchDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'match_date'
  },
  venue: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'live', 'finished', 'postponed', 'cancelled'),
    allowNull: false,
    defaultValue: 'scheduled'
  },
  homeScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'home_score',
    validate: {
      min: 0
    }
  },
  awayScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'away_score',
    validate: {
      min: 0
    }
  },
  halfTimeHomeScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'half_time_home_score',
    validate: {
      min: 0
    }
  },
  halfTimeAwayScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'half_time_away_score',
    validate: {
      min: 0
    }
  },
  attendance: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  referee: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  matchWeek: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'match_week',
    validate: {
      min: 1
    }
  },
  season: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  currentMinute: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_minute',
    validate: {
      min: 0,
      max: 120
    }
  }
}, {
  tableName: 'matches',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['match_date'] },
    { fields: ['status'] },
    { fields: ['league_id'] },
    { fields: ['home_team_id'] },
    { fields: ['away_team_id'] },
    { fields: ['match_date', 'status'] }
  ],
  validate: {
    teamsAreDifferent() {
      if (this.homeTeamId === this.awayTeamId) {
        throw new Error('Home team and away team must be different');
      }
    }
  }
});

Match.prototype.isUpcoming = function() {
  return this.status === 'scheduled' && new Date(this.matchDate) > new Date();
};

Match.prototype.isLive = function() {
  return this.status === 'live';
};

Match.prototype.isFinished = function() {
  return this.status === 'finished';
};

module.exports = Match;