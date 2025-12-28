const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const League = require('./League');
const Team = require('./Team');
const Player = require('./Player');
const Match = require('./Match');
const MatchEvent = require('./MatchEvent');
const NewsSource = require('./NewsSource');
const News = require('./News');
const Comment = require('./Comment');
const UserFavorite = require('./UserFavorite');
const Session = require('./Session')

// Define associations

// User <-> Team (One-to-One for team accounts)
User.hasOne(Team, { foreignKey: 'userId', as: 'teamProfile' });
Team.belongsTo(User, { foreignKey: 'userId', as: 'account' });

// League <-> Team (One-to-Many)
League.hasMany(Team, { foreignKey: 'leagueId', as: 'teams' });
Team.belongsTo(League, { foreignKey: 'leagueId', as: 'league' });

// Team <-> Player (One-to-Many)
Team.hasMany(Player, { foreignKey: 'teamId', as: 'players' });
Player.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

// League <-> Match (One-to-Many)
League.hasMany(Match, { foreignKey: 'leagueId', as: 'matches' });
Match.belongsTo(League, { foreignKey: 'leagueId', as: 'league' });

// Team <-> Match (home and away teams)
Team.hasMany(Match, { foreignKey: 'homeTeamId', as: 'homeMatches' });
Team.hasMany(Match, { foreignKey: 'awayTeamId', as: 'awayMatches' });
Match.belongsTo(Team, { foreignKey: 'homeTeamId', as: 'homeTeam' });
Match.belongsTo(Team, { foreignKey: 'awayTeamId', as: 'awayTeam' });

// Match <-> MatchEvent (One-to-Many)
Match.hasMany(MatchEvent, { foreignKey: 'matchId', as: 'events' });
MatchEvent.belongsTo(Match, { foreignKey: 'matchId', as: 'match' });

// Team <-> MatchEvent (One-to-Many)
Team.hasMany(MatchEvent, { foreignKey: 'teamId', as: 'matchEvents' });
MatchEvent.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

// Player <-> MatchEvent (One-to-Many)
Player.hasMany(MatchEvent, { foreignKey: 'playerId', as: 'events' });
MatchEvent.belongsTo(Player, { foreignKey: 'playerId', as: 'player' });

// NewsSource <-> News (One-to-Many)
NewsSource.hasMany(News, { foreignKey: 'sourceId', as: 'articles' });
News.belongsTo(NewsSource, { foreignKey: 'sourceId', as: 'source' });

// User <-> News (One-to-Many - for original content authors)
User.hasMany(News, { foreignKey: 'authorId', as: 'articles' });
News.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// News <-> Team (Many-to-Many through NewsTeams junction table)
News.belongsToMany(Team, { 
  through: 'news_teams', 
  foreignKey: 'newsId',
  otherKey: 'teamId',
  as: 'relatedTeams' 
});
Team.belongsToMany(News, { 
  through: 'news_teams', 
  foreignKey: 'teamId',
  otherKey: 'newsId',
  as: 'newsArticles' 
});


// News <-> Comment (One-to-Many)
News.hasMany(Comment, { foreignKey: 'newsId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(News, { foreignKey: 'newsId', as: 'news' });

// User <-> Comment (One-to-Many)
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Comment <-> Comment (Self-referencing for nested comments)
Comment.hasMany(Comment, { foreignKey: 'parentCommentId', as: 'replies', onDelete: 'CASCADE' });
Comment.belongsTo(Comment, { foreignKey: 'parentCommentId', as: 'parentComment' });


// User <-> Team (Many-to-Many through user_favorites)
User.belongsToMany(Team, {through: UserFavorite,foreignKey: 'userId',
otherKey: 'teamId',as:'favoriteTeams'});
Team.belongsToMany(User, {through: UserFavorite,foreignKey: 'teamId',
otherKey: 'userId',as: 'followers'});


module.exports = {
sequelize,User,
League,Team,
Player,Match,
MatchEvent,NewsSource,
News,Comment,
UserFavorite,Session
};