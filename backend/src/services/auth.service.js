/**
 * @module authService
 * @description Auth Service - Business logic for authentication
 */
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getConfig } = require('../config/env');
const AppError = require('../core/errors/AppError');

const { JWT_SECRET, REFRESH_JWT_SECRET, jwtExpiresIn, refreshTokenExpiresIn } = getConfig();
const JWT_EXPIRES_IN = jwtExpiresIn;
const REFRESH_TOKEN_EXPIRES_IN = refreshTokenExpiresIn;

/**
 * Registers a new user in the system
 * @param {Object} params - Registration parameters
 * @param {string} params.email - User's email address
 * @param {string} params.password - User's password
 * @param {string} [params.name] - User's name
 * @returns {Promise<{id: string, email: string, name: string, status: string}>} - Created user object
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
 * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>} - User data and tokens
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

  const roles = fullUser.roles.map(ur => ({
    id: ur.role.id,
    name: ur.role.name,
    isSuperAdmin: ur.role.isSuperAdmin
  }));

  const permissions = fullUser.roles.flatMap(ur =>
    ur.role.permissions.map(rp => ({
      module: rp.permission.module,
      action: rp.permission.action
    }))
  );

  const isSuperAdmin = fullUser.roles.some(ur => ur.role.isSuperAdmin);

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, tokenType: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, tokenType: 'refresh' },
    REFRESH_JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.refreshToken.create({
    data: {
      token: tokenHash,
      userId: user.id,
      expiresAt
    }
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
      permissions,
      isSuperAdmin
    },
    accessToken,
    refreshToken
  };
};

/**
 * Refreshes an access token using a valid refresh token
 * @param {Object} params - Token refresh parameters
 * @param {string} params.refreshToken - The refresh token to use
 * @returns {Promise<{accessToken: string}>} - New access token
 * @throws {AppError} 401 - Invalid or expired refresh token
 * @throws {AppError} 401 - User account is not active
 */
const refreshToken = async ({ refreshToken: token }) => {
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
 * @returns {Promise<{message: string}>} - Success message
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

/**
 * Retrieves the current user's profile
 * @param {string} userId - The user's ID
 * @returns {Promise<{id: string, email: string, name: string, status: string, roles: Array, permissions: Array, isSuperAdmin: boolean}>} - User profile data
 * @throws {AppError} 404 - User not found
 */
const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const roles = user.roles.map(ur => ({
    id: ur.role.id,
    name: ur.role.name,
    isSuperAdmin: ur.role.isSuperAdmin
  }));

  const permissions = user.roles.flatMap(ur => 
    ur.role.permissions.map(rp => ({
      module: rp.permission.module,
      action: rp.permission.action
    }))
  );

  const isSuperAdmin = user.roles.some(ur => ur.role.isSuperAdmin);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    roles,
    permissions,
    isSuperAdmin
  };
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile
};