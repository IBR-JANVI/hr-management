/**
 * @module pagination
 * @description Shared pagination utility for normalizing pagination parameters
 */
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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