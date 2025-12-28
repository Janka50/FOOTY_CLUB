/**
 * Simple logging utility
 * In production, replace with Winston or Pino
 */
const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()}:`, message, meta);
  },

  error: (message, error = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()}:`, message);
    if (error.stack) {
      console.error(error.stack);
    }
  },

  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()}:`, message, meta);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()}:`, message, meta);
    }
  }
};

module.exports = logger;