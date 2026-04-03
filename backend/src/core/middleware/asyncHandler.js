/**
 * @module catchAsync
 * @description Middleware module that exports the catchAsync function for wrapping async route handlers to catch errors and pass to next middleware
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
