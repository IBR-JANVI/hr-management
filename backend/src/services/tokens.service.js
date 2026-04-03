/**
 * @module tokensService
 * @description Token and Session Service - Handle token creation, storage, and validation
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getConfig } = require('../config/env');
const AppError = require('../core/errors/AppError');

const { JWT_SECRET, REFRESH_JWT_SECRET, jwtExpiresIn, refreshTokenExpiresIn } = getConfig();
const JWT_EXPIRES_IN = jwtExpiresIn;
const REFRESH_TOKEN_EXPIRES_IN = refreshTokenExpiresIn;

/**
 * Creates access and refresh tokens for a user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
const createTokens = async (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email, tokenType: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, tokenType: 'refresh' },
    REFRESH_JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

/**
 * Stores a refresh token in the database
 * @param {string} refreshToken - The raw refresh token
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const storeRefreshToken = async (refreshToken, userId) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.refreshToken.create({
    data: {
      token: tokenHash,
      userId,
      expiresAt
    }
  });
};

/**
 * Refreshes an access token using a valid refresh token
 * @param {string} token - The refresh token
 * @returns {Promise<{accessToken: string}>}
 * @throws {AppError} 401 - Invalid or expired refresh token
 * @throws {AppError} 401 - User account is not active
 */
const refreshToken = async (token) => {
  if (typeof token !== 'string' || token.trim() === '') {
    throw new AppError('Invalid refresh token', 401);
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  let decoded;
  try {
    decoded = jwt.verify(token, REFRESH_JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      await prisma.refreshToken.deleteMany({ where: { token: tokenHash } });
      throw new AppError('Refresh token expired', 401);
    }
    throw new AppError('Invalid refresh token', 401);
  }

  if (decoded.tokenType !== 'refresh') {
    throw new AppError('Invalid refresh token', 401);
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: tokenHash },
    include: {
      user: true
    }
  });

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { id: storedToken.id }
    });

    throw new AppError('Refresh token expired', 401);
  }

  if (storedToken.user.status !== 'ACTIVE') {
    await prisma.refreshToken.delete({
      where: { id: storedToken.id }
    });
    throw new AppError('User account is not active', 401);
  }

  const accessToken = jwt.sign(
    { userId: storedToken.user.id, email: storedToken.user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { accessToken };
};

/**
 * Logs out a user by invalidating their refresh token
 * @param {Object} params - Logout parameters
 * @param {string} [params.refreshToken] - The refresh token to invalidate
 * @param {string} [params.userId] - User ID (used when no refreshToken provided)
 * @returns {Promise<{message: string}>}
 */
const logout = async ({ refreshToken: token, userId }) => {
  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.refreshToken.deleteMany({
      where: { token: tokenHash }
    });
  } else if (userId) {
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });
  }

  return { message: 'Logged out successfully' };
};

module.exports = {
  createTokens,
  storeRefreshToken,
  refreshToken,
  logout
};