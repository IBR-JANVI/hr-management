/**
 * @module pagination
 * @description Shared pagination utility for normalizing pagination parameters
 */

/**
 * Normalizes pagination parameters
 * @param {number|string} [page=1] - Page number (default 1)
 * @param {number|string} [limit=20] - Items per page (default 20, max 100)
 * @returns {{page: number, limit: number, skip: number}} Normalized page, limit and computed skip
 * @example
 * const result = normalizePagination(2, 10);
 * // Returns: { page: 2, limit: 10, skip: 10 }
 * 
 * const result2 = normalizePagination('3', '25');
 * // Returns: { page: 3, limit: 25, skip: 50 }
 */
const normalizePagination = (page = 1, limit = DEFAULT_LIMIT) => {
  const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
  const normalizedLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit
  };
};

module.exports = {
  normalizePagination,
  DEFAULT_LIMIT,
  MAX_LIMIT
};