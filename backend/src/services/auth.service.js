/**
 * @module authService
 * @description Auth Service - Business logic for authentication
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getConfig } = require('../config/env');
const AppError = require('../core/errors/AppError');

const { JWT_SECRET, jwtExpiresIn, refreshTokenExpiresIn } = getConfig();
const JWT_EXPIRES_IN = jwtExpiresIn;
const REFRESH_TOKEN_EXPIRES_IN = refreshTokenExpiresIn;

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

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
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
    throw new AppError('Invalid credentials', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('Account is not active. Please contact admin for approval.', 403);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
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

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
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

const refreshToken = async ({ refreshToken: token }) => {
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      await prisma.refreshToken.deleteMany({ where: { token } });
      throw new AppError('Refresh token expired', 401);
    }
    throw new AppError('Invalid refresh token', 401);
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
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

  const accessToken = jwt.sign(
    { userId: storedToken.user.id, email: storedToken.user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { accessToken };
};

const logout = async ({ refreshToken: token }) => {
  if (token) {
    await prisma.refreshToken.deleteMany({
      where: { token }
    });
  }

  return { message: 'Logged out successfully' };
};

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