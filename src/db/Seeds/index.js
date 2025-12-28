const { sequelize } = require('../../config/database');
const models = require('../../models');

/**
 * Seed the database with sample data
 * This creates realistic test data for development
 */
const seedDatabase = async () => {
  // Use a transaction for data integrity
  const transaction = await sequelize.transaction();

  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data (optional - comment out to preserve data)
    console.log('🗑️  Clearing existing data...');
    await models.Session.destroy({ where: {}, force: true, transaction });
    await models.Comment.destroy({ where: {}, force: true, transaction });
    await models.UserFavorite.destroy({ where: {}, force: true, transaction });
    await models.MatchEvent.destroy({ where: {}, force: true, transaction });
    await models.Match.destroy({ where: {}, force: true, transaction });
    await models.Player.destroy({ where: {}, force: true, transaction });
    await models.News.destroy({ where: {}, force: true, transaction });
    await models.Team.destroy({ where: {}, force: true, transaction });
    await models.League.destroy({ where: {}, force: true, transaction });
    await models.NewsSource.destroy({ where: {}, force: true, transaction });
    await models.User.destroy({ where: {}, force: true, transaction });
    console.log('✓ Existing data cleared\n');

    // 1. Create Users
    console.log('👥 Creating users...');
    const users = await models.User.bulkCreate([
      {
        username: 'admin',
        email: 'admin@football.com',
        password: 'admin123', // Changed from passwordHash to password
        accountType: 'admin',
        fullName: 'Admin User',
        isVerified: true,
        isActive: true
      },
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        accountType: 'fan',
        fullName: 'John Doe',
        bio: 'Passionate football fan from London',
        isVerified: true,
        isActive: true
      },
      {
        username: 'janedoe',
        email: 'jane@example.com',
        password: 'password123',
        accountType: 'fan',
        fullName: 'Jane Doe',
        bio: 'Love watching Premier League matches',
        isVerified: true,
        isActive: true
      },
      {
        username: 'manutd_official',
        email: 'contact@manutd.com',
        password: 'teampass123',
        accountType: 'team',
        fullName: 'Manchester United Official',
        isVerified: true,
        isActive: true
      },
      {
        username: 'chelsea_fc',
        email: 'info@chelseafc.com',
        password: 'teampass123',
        accountType: 'team',
        fullName: 'Chelsea FC Official',
        isVerified: true,
        isActive: true
      }
    ], { 
      individualHooks: true,  // This ensures beforeCreate hooks run
      transaction 
    });

    console.log(`✓ Created ${users.length} users\n`);

    // 2. Create News Sources
    console.log('📰 Creating news sources...');
    const newsSources = await models.NewsSource.bulkCreate([
      {
        name: 'ESPN',
        sourceType: 'media',
        url: 'https://espn.com',
        logoUrl: 'https://example.com/espn-logo.png',
        isActive: true
      },
      {
        name: 'Sky Sports',
        sourceType: 'media',
        url: 'https://skysports.com',
        logoUrl: 'https://example.com/sky-logo.png',
        isActive: true
      },
      {
        name: 'BBC Sport',
        sourceType: 'media',
        url: 'https://bbc.com/sport',
        logoUrl: 'https://example.com/bbc-logo.png',
        isActive: true
      },
      {
        name: 'Marca',
        sourceType: 'media',
        url: 'https://marca.com',
        logoUrl: 'https://example.com/marca-logo.png',
        isActive: true
      }
    ], { transaction });

    console.log(`✓ Created ${newsSources.length} news sources\n`);

    // 3. Create Leagues
    console.log('🏆 Creating leagues...');
    const leagues = await models.League.bulkCreate([
      {
        name: 'Premier League',
        country: 'England',
        leagueType: 'major',
        logoUrl: 'https://example.com/epl-logo.png',
        description: 'The top tier of English football',
        foundedYear: 1992,
        currentSeason: '2024/25',
        isActive: true
      },
      {
        name: 'La Liga',
        country: 'Spain',
        leagueType: 'major',
        logoUrl: 'https://example.com/laliga-logo.png',
        description: 'Spanish premier football league',
        foundedYear: 1929,
        currentSeason: '2024/25',
        isActive: true
      },
      {
        name: 'Serie A',
        country: 'Italy',
        leagueType: 'major',
        logoUrl: 'https://example.com/seriea-logo.png',
        description: 'Top Italian football league',
        foundedYear: 1898,
        currentSeason: '2024/25',
        isActive: true
      },
      {
        name: 'Championship',
        country: 'England',
        leagueType: 'minor',
        logoUrl: 'https://example.com/championship-logo.png',
        description: 'Second tier of English football',
        foundedYear: 2004,
        currentSeason: '2024/25',
        isActive: true
      }
    ], { transaction });

    console.log(`✓ Created ${leagues.length} leagues\n`);

    // 4. Create Teams
    console.log('⚽ Creating teams...');
    const teams = await models.Team.bulkCreate([
      {
        leagueId: leagues[0].id, // Premier League
        userId: users[3].id, // manutd_official
        name: 'Manchester United',
        shortName: 'Man Utd',
        logoUrl: 'https://example.com/manutd-logo.png',
        stadium: 'Old Trafford',
        foundedYear: 1878,
        country: 'England',
        city: 'Manchester',
        description: 'One of the most successful clubs in English football',
        officialWebsite: 'https://manutd.com',
        socialMedia: {
          twitter: '@ManUtd',
          instagram: '@manchesterunited',
          facebook: 'manchesterunited'
        },
        isVerified: true,
        followersCount: 0
      },
      {
        leagueId: leagues[0].id, // Premier League
        userId: users[4].id, // chelsea_fc
        name: 'Chelsea FC',
        shortName: 'Chelsea',
        logoUrl: 'https://example.com/chelsea-logo.png',
        stadium: 'Stamford Bridge',
        foundedYear: 1905,
        country: 'England',
        city: 'London',
        description: 'London-based football club with rich history',
        officialWebsite: 'https://chelseafc.com',
        socialMedia: {
          twitter: '@ChelseaFC',
          instagram: '@chelseafc',
          facebook: 'ChelseaFC'
        },
        isVerified: true,
        followersCount: 0
      },
      {
        leagueId: leagues[0].id, // Premier League
        userId: null,
        name: 'Liverpool FC',
        shortName: 'Liverpool',
        logoUrl: 'https://example.com/liverpool-logo.png',
        stadium: 'Anfield',
        foundedYear: 1892,
        country: 'England',
        city: 'Liverpool',
        description: 'Six-time European champions',
        officialWebsite: 'https://liverpoolfc.com',
        socialMedia: {
          twitter: '@LFC',
          instagram: '@liverpoolfc',
          facebook: 'LiverpoolFC'
        },
        isVerified: false,
        followersCount: 0
      },
      {
        leagueId: leagues[0].id, // Premier League
        userId: null,
        name: 'Arsenal FC',
        shortName: 'Arsenal',
        logoUrl: 'https://example.com/arsenal-logo.png',
        stadium: 'Emirates Stadium',
        foundedYear: 1886,
        country: 'England',
        city: 'London',
        description: 'North London football club',
        officialWebsite: 'https://arsenal.com',
        socialMedia: {
          twitter: '@Arsenal',
          instagram: '@arsenal',
          facebook: 'Arsenal'
        },
        isVerified: false,
        followersCount: 0
      },
      {
        leagueId: leagues[1].id, // La Liga
        userId: null,
        name: 'Real Madrid',
        shortName: 'Madrid',
        logoUrl: 'https://example.com/realmadrid-logo.png',
        stadium: 'Santiago Bernabéu',
        foundedYear: 1902,
        country: 'Spain',
        city: 'Madrid',
        description: 'Most successful club in European football',
        officialWebsite: 'https://realmadrid.com',
        socialMedia: {
          twitter: '@realmadrid',
          instagram: '@realmadrid',
          facebook: 'RealMadrid'
        },
        isVerified: false,
        followersCount: 0
      },
      {
        leagueId: leagues[1].id, // La Liga
        userId: null,
        name: 'FC Barcelona',
        shortName: 'Barça',
        logoUrl: 'https://example.com/barcelona-logo.png',
        stadium: 'Camp Nou',
        foundedYear: 1899,
        country: 'Spain',
        city: 'Barcelona',
        description: 'Catalan giants with global fanbase',
        officialWebsite: 'https://fcbarcelona.com',
        socialMedia: {
          twitter: '@FCBarcelona',
          instagram: '@fcbarcelona',
          facebook: 'fcbarcelona'
        },
        isVerified: false,
        followersCount: 0
      }
    ], { transaction });

    console.log(`✓ Created ${teams.length} teams\n`);

    // 5. Create Players
    console.log('👤 Creating players...');
    const players = await models.Player.bulkCreate([
      // Manchester United players
      {
        teamId: teams[0].id,
        name: 'Marcus Rashford',
        position: 'FWD',
        jerseyNumber: 10,
        dateOfBirth: '1997-10-31',
        nationality: 'England',
        photoUrl: 'https://example.com/rashford.png',
        isActive: true,
        appearances: 45,
        goals: 17,
        assists: 5,
        yellowCards: 3,
        redCards: 0
      },
      {
        teamId: teams[0].id,
        name: 'Bruno Fernandes',
        position: 'MID',
        jerseyNumber: 8,
        dateOfBirth: '1994-09-08',
        nationality: 'Portugal',
        photoUrl: 'https://example.com/bruno.png',
        isActive: true,
        appearances: 50,
        goals: 12,
        assists: 18,
        yellowCards: 8,
        redCards: 0
      },
      {
        teamId: teams[0].id,
        name: 'André Onana',
        position: 'GK',
        jerseyNumber: 24,
        dateOfBirth: '1996-04-02',
        nationality: 'Cameroon',
        photoUrl: 'https://example.com/onana.png',
        isActive: true,
        appearances: 38,
        goals: 0,
        assists: 0,
        yellowCards: 2,
        redCards: 0
      },
      // Chelsea players
      {
        teamId: teams[1].id,
        name: 'Cole Palmer',
        position: 'MID',
        jerseyNumber: 20,
        dateOfBirth: '2002-05-06',
        nationality: 'England',
        photoUrl: 'https://example.com/palmer.png',
        isActive: true,
        appearances: 42,
        goals: 22,
        assists: 11,
        yellowCards: 4,
        redCards: 0
      },
      {
        teamId: teams[1].id,
        name: 'Nicolas Jackson',
        position: 'FWD',
        jerseyNumber: 15,
        dateOfBirth: '2001-06-20',
        nationality: 'Senegal',
        photoUrl: 'https://example.com/jackson.png',
        isActive: true,
        appearances: 40,
        goals: 14,
        assists: 5,
        yellowCards: 6,
        redCards: 1
      },
      // Liverpool players
      {
        teamId: teams[2].id,
        name: 'Mohamed Salah',
        position: 'FWD',
        jerseyNumber: 11,
        dateOfBirth: '1992-06-15',
        nationality: 'Egypt',
        photoUrl: 'https://example.com/salah.png',
        isActive: true,
        appearances: 44,
        goals: 25,
        assists: 13,
        yellowCards: 2,
        redCards: 0
      }
    ], { transaction });

    console.log(`✓ Created ${players.length} players\n`);

    // 6. Create Matches
    console.log('🏟️  Creating matches...');
    const matches = await models.Match.bulkCreate([
      {
        leagueId: leagues[0].id,
        homeTeamId: teams[0].id, // Man Utd
        awayTeamId: teams[1].id, // Chelsea
        matchDate: new Date('2024-12-20T15:00:00Z'),
        venue: 'Old Trafford',
        status: 'scheduled',
        homeScore: 0,
        awayScore: 0,
        matchWeek: 17,
        season: '2024/25'
      },
      {
        leagueId: leagues[0].id,
        homeTeamId: teams[2].id, // Liverpool
        awayTeamId: teams[3].id, // Arsenal
        matchDate: new Date('2024-12-21T17:30:00Z'),
        venue: 'Anfield',
        status: 'scheduled',
        homeScore: 0,
        awayScore: 0,
        matchWeek: 17,
        season: '2024/25'
      },
      {
        leagueId: leagues[0].id,
        homeTeamId: teams[0].id, // Man Utd
        awayTeamId: teams[2].id, // Liverpool
        matchDate: new Date('2024-12-15T12:30:00Z'),
        venue: 'Old Trafford',
        status: 'finished',
        homeScore: 2,
        awayScore: 2,
        halfTimeHomeScore: 1,
        halfTimeAwayScore: 1,
        attendance: 74500,
        referee: 'Michael Oliver',
        matchWeek: 16,
        season: '2024/25'
      }
    ], { transaction });

    console.log(`✓ Created ${matches.length} matches\n`);

    // 7. Create Match Events
    console.log('⚡ Creating match events...');
    const matchEvents = await models.MatchEvent.bulkCreate([
      // Events for the finished match (Man Utd 2-2 Liverpool)
      {
        matchId: matches[2].id,
        teamId: teams[0].id, // Man Utd
        playerId: players[0].id, // Rashford
        eventType: 'goal',
        minute: 23,
        description: 'Header from corner'
      },
      {
        matchId: matches[2].id,
        teamId: teams[2].id, // Liverpool
        playerId: players[5].id, // Salah
        eventType: 'goal',
        minute: 35,
        description: 'Counter-attack finish'
      },
      {
        matchId: matches[2].id,
        teamId: teams[0].id, // Man Utd
        playerId: players[1].id, // Bruno
        eventType: 'goal',
        minute: 67,
        description: 'Penalty kick'
      },
      {
        matchId: matches[2].id,
        teamId: teams[2].id, // Liverpool
        playerId: players[5].id, // Salah
        eventType: 'goal',
        minute: 81,
        description: 'Solo run and finish'
      },
      {
        matchId: matches[2].id,
        teamId: teams[0].id,
        playerId: players[1].id,
        eventType: 'yellow_card',
        minute: 89,
        description: 'Tactical foul'
      }
    ], { transaction });

    console.log(`✓ Created ${matchEvents.length} match events\n`);

    // 8. Create News
    console.log('📰 Creating news articles...');
    const news = await models.News.bulkCreate([
      {
        sourceId: newsSources[0].id, // ESPN
        authorId: null,
        title: 'Manchester United Sign New Midfielder in Record Deal',
        slug: 'manchester-united-sign-new-midfielder-' + Date.now(),
        content: 'Manchester United have completed the signing of a world-class midfielder in a deal worth £80 million. The player has signed a five-year contract and will wear the number 7 shirt. This marks a new era for the club as they look to challenge for major honors this season. The midfielder brings extensive experience from European football and is expected to make an immediate impact in the Premier League.',
        summary: 'Man Utd complete record signing of midfielder for £80m',
        featuredImageUrl: 'https://example.com/transfer-news.jpg',
        category: 'transfer',
        newsType: 'aggregated',
        externalUrl: 'https://espn.com/football/story/123',
        viewCount: 1250,
        isBreaking: true,
        isPublished: true,
        publishedAt: new Date()
      },
      {
        sourceId: newsSources[1].id, // Sky Sports
        authorId: users[0].id, // Admin
        title: 'Premier League: Top 5 Goals of the Week',
        slug: 'premier-league-top-5-goals-' + Date.now(),
        content: 'This week in the Premier League saw some spectacular goals. From long-range strikes to incredible team moves, here are the top 5 goals that lit up the weekend fixtures. Number 5 features a stunning volley, while our top goal showcases brilliant individual skill and composure under pressure.',
        summary: 'Watch the best goals from this Premier League weekend',
        featuredImageUrl: 'https://example.com/goals.jpg',
        category: 'match_report',
        newsType: 'original',
        viewCount: 890,
        isBreaking: false,
        isPublished: true,
        publishedAt: new Date()
      },
      {
        sourceId: newsSources[2].id, // BBC Sport
        authorId: null,
        title: 'Liverpool Manager Speaks on Title Race',
        slug: 'liverpool-manager-title-race-' + Date.now(),
        content: 'Liverpool manager addressed the media today about the team\'s chances in the title race. "We\'re taking it one game at a time," he said during the pre-match press conference. "Every match is crucial at this stage of the season, and we need to maintain our focus and consistency. The squad is in great shape both mentally and physically."',
        summary: 'Liverpool boss comments on championship aspirations',
        featuredImageUrl: 'https://example.com/interview.jpg',
        category: 'interview',
        newsType: 'aggregated',
        externalUrl: 'https://bbc.com/sport/football/456',
        viewCount: 567,
        isBreaking: false,
        isPublished: true,
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      }
    ], { transaction });

    console.log(`✓ Created ${news.length} news articles\n`);

    // 9. Link News to Teams (Many-to-Many)
    console.log('🔗 Linking news to teams...');
    await news[0].addRelatedTeams([teams[0].id], { transaction }); // Man Utd transfer news
    await news[1].addRelatedTeams([teams[0].id, teams[1].id, teams[2].id], { transaction }); // Multiple teams
    await news[2].addRelatedTeams([teams[2].id], { transaction }); // Liverpool interview
    console.log('✓ News-team relationships created\n');

    // 10. Create Comments
    console.log('💬 Creating comments...');
    const comments = await models.Comment.bulkCreate([
      {
        newsId: news[0].id,
        userId: users[1].id, // johndoe
        parentCommentId: null,
        content: 'Great signing! This is exactly what we needed.',
        likesCount: 15,
        isEdited: false,
        isDeleted: false
      },
      {
        newsId: news[0].id,
        userId: users[2].id, // janedoe
        parentCommentId: null,
        content: 'Too expensive for someone unproven in the Premier League.',
        likesCount: 8,
        isEdited: false,
        isDeleted: false
      },
      {
        newsId: news[1].id,
        userId: users[1].id,
        parentCommentId: null,
        content: 'That Salah goal was incredible!',
        likesCount: 23,
        isEdited: false,
        isDeleted: false
      }
    ], { transaction });

    // Create a reply to first comment
    await models.Comment.create({
      newsId: news[0].id,
      userId: users[2].id,
      parentCommentId: comments[0].id, // Reply to johndoe's comment
      content: 'I agree! He will fit perfectly into our system.',
      likesCount: 5,
      isEdited: false,
      isDeleted: false
    }, { transaction });

    console.log(`✓ Created ${comments.length + 1} comments\n`);

    // 11. Create User Favorites
    console.log('⭐ Creating user favorites...');
    await models.UserFavorite.bulkCreate([
      { userId: users[1].id, teamId: teams[0].id }, // John follows Man Utd
      { userId: users[1].id, teamId: teams[2].id }, // John follows Liverpool
      { userId: users[2].id, teamId: teams[1].id }, // Jane follows Chelsea
      { userId: users[2].id, teamId: teams[3].id }  // Jane follows Arsenal
    ], { transaction });
    console.log('✓ User favorites created\n');

    // Commit transaction
    await transaction.commit();

    console.log('=================================');
    console.log('✅ Database seeding completed successfully!');
    console.log('=================================\n');

    console.log('📊 Summary:');
    console.log(`  Users: ${users.length}`);
    console.log(`  News Sources: ${newsSources.length}`);
    console.log(`  Leagues: ${leagues.length}`);
    console.log(`  Teams: ${teams.length}`);
    console.log(`  Players: ${players.length}`);
    console.log(`  Matches: ${matches.length}`);
    console.log(`  Match Events: ${matchEvents.length}`);
    console.log(`  News Articles: ${news.length}`);
    console.log(`  Comments: ${comments.length + 1}`);
    console.log(`  User Favorites: 4\n`);

    console.log('🔐 Test Credentials:');
    console.log('  Admin: admin@football.com / admin123');
    console.log('  Fan: john@example.com / password123');
    console.log('  Team Account: contact@manutd.com / teampass123\n');

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('\n❌ Seeding failed:', error);
    console.error('Error details:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✓ Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };