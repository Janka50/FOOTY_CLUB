/**
 * Wrapper for async route handlers
 * Catches errors and passes them to error middleware
 * 
 * Usage:
 * router.get('/path', asyncHandler(async (req, res) => {
 *   // Your async code here
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;