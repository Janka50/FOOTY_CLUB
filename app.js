require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { errorHandler, notFoundHandler } = require('./src/Middlewares/errorhandler');
const { apiLimiter } = require('./src/Middlewares/ratelimiter');
const logger = require('./src/Utils/logger');

// Create Express app
const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', apiLimiter);

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', require('./src/Routes/authRoutes'));
app.use('/api/users', require('./src/Routes/userRoutes'));
app.use('/api/leagues', require('./src/Routes/leagueRoutes'));
app.use('/api/teams', require('./src/Routes/teamRoutes'));
app.use('/api/matches', require('./src/Routes/matchRoutes'));
app.use('/api/news', require('./src/Routes/newsRoutes'));
app.use('/api', require('./src/Routes/commentRoutes')); 


// ERROR HANDLING

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

//
// EXPORT


module.exports = app;