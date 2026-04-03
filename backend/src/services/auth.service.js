/**
 * @module authService
 * @description Auth Service - Business logic for authentication
 */
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const AppError = require('../core/errors/AppError');
const tokensService = require('./tokens.service');
const profileService = require('./profile.service');

/**
 * Registers a new user in the system
 * @param {Object} params - Registration parameters
 * @param {string} params.email - User's email address
 * @param {string} params.password - User's password
 * @param {string} [params.name] - User's name
 * @returns {Promise<{id: string, email: string, name: string, status: string}>}
 * @throws {AppError} 409 - Email already registered
 */
const register = async ({ email, password, name }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      status: 'PENDING'
    }
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status
  };
};

/**
 * Authenticates a user and returns access/refresh tokens
 * @param {Object} params - Login parameters
 * @param {string} params.email - User's email address
 * @param {string} params.password - User's password
 * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
 * @throws {AppError} 401 - Invalid credentials
 * @throws {AppError} 403 - Account is not active
 */
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      status: true
    }
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('Account is not active. Please contact admin for approval.', 403);
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  const shapedUser = profileService.shapeUser(fullUser);

  const { accessToken, refreshToken } = await tokensService.createTokens(user.id, user.email);
  await tokensService.storeRefreshToken(refreshToken, user.id);

  return {
    user: shapedUser,
    accessToken,
    refreshToken
  };
};

/**
 * Refreshes an access token using a valid refresh token
 * @param {Object} params - Token refresh parameters
 * @param {string} params.refreshToken - The refresh token to use
 * @returns {Promise<{accessToken: string}>}
 * @throws {AppError} 401 - Invalid or expired refresh token
 */
const refreshToken = async ({ refreshToken: token }) => {
  return tokensService.refreshToken(token);
};

/**
 * Logs out a user by invalidating their refresh token
 * @param {Object} params - Logout parameters
 * @param {string} [params.refreshToken] - The refresh token to invalidate
 * @param {string} [params.userId] - User ID (used when no refreshToken provided)
 * @returns {Promise<{message: string}>}
 */
const logout = async ({ refreshToken: token, userId }) => {
  return tokensService.logout({ refreshToken: token, userId });
};

/**
 * Retrieves the current user's profile
 * @param {string} userId - The user's ID
 * @returns {Promise<{id: string, email: string, name: string, status: string, roles: Array, permissions: Array, isSuperAdmin: boolean}>}
 * @throws {AppError} 404 - User not found
 */
const getProfile = async (userId) => {
  return profileService.getProfile(userId);
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile
};