// this wraps an async route handler so any rejected promise / thrown error
// is passed to next(err) automatically, instead of needing try/catch everywhere.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
