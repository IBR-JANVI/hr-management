/**
 * `@module` services/user
 * `@description` User service handling CRUD operations for user entities.
 */

const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');

const SALT_ROUNDS = 10;

/**
 * User service for managing user CRUD operations.
 * @typedef {Object} userService
 * @property {Function} findAll - Find all users with pagination
 * @property {Function} findById - Find user by ID
 * @property {Function} findByEmail - Find user by email
 * @property {Function} create - Create a new user
 * @property {Function} update - Update a user by ID
 * @property {Function} delete - Delete a user by ID
 */

/**
 * @async
 * @function findAll
 * @description Fetch all users with pagination support.
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1] - Page number (default 1)
 * @param {number} [options.limit=20] - Number of users per page (default 20, capped 1-100)
 * @returns {Promise<{users: Array<Object>, pagination: {page: number, limit: number, total: number, totalPages: number}}>} Object containing users array and pagination info
 * @throws {Error} Throws Prisma errors or other runtime errors
 */
const findAll = async ({ page = 1, limit = 20 }) => {
  const cappedLimit = Math.min(Math.max(1, limit), 100);
  const skip = (Math.max(1, page) - 1) * cappedLimit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: cappedLimit,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    pagination: {
      page: Math.max(1, page),
      limit: cappedLimit,
      total,
      totalPages: Math.ceil(total / cappedLimit),
    },
  };
};

/**
 * @async
 * @function findById
 * @description Fetch a user by primary key (ID).
 * @param {string|number} id - User ID
 * @returns {Promise<Object|null>} The user object with selected fields (id, email, name, createdAt, updatedAt), or null if not found
 * @throws {Error} Throws Prisma errors or other runtime errors
 * @example
 * const user = await findById('user-123');
 */
const findById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

/**
 * @async
 * @function findByEmail
 * @description Fetch a user by email address.
 * @param {string} email - User email
 * @returns {Promise<Object|null>} The user object with selected fields (id, email, name, createdAt, updatedAt), or null if not found
 * @throws {Error} Throws Prisma errors or other runtime errors
 */
const findByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

/**
 * @async
 * @function create
 * @description Create a new user with email, name, and password.
 * @param {Object} data - User data object
 * @param {string} data.email - User email address
 * @param {string} data.name - User full name
 * @param {string} data.password - User password (plain text, should be hashed before storage)
 * @returns {Promise<Object>} The created user object with fields: id, email, name, createdAt, updatedAt
 * @throws {Error} Throws validation errors or Prisma errors (e.g., unique constraint violation)
 */
const create = async (data) => {
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

/**
 * @async
 * @function update
 * @description Updates a user by ID with provided fields.
 * @param {string|number} id - User ID
 * @param {Object} data - Fields to update
 * @param {string} [data.name] - User name
 * @param {string} [data.email] - User email
 * @returns {Promise<Object>} The updated user object with fields: id, email, name, createdAt, updatedAt
 * @throws {Error} Throws 400 error if no valid fields provided
 * @throws {Error} Throws 404 error if user not found (Prisma error code P2025)
 * @throws {Error} Throws Prisma errors or other runtime errors
 */
const update = async (id, data) => {
  const allowedFields = {};
  if (data.name !== undefined) allowedFields.name = data.name;
  if (data.email !== undefined) allowedFields.email = data.email;

  if (Object.keys(allowedFields).length === 0) {
    const validationError = new Error('No valid fields provided to update');
    validationError.statusCode = 400;
    throw validationError;
  }

  return prisma.user.update({
    where: { id },
    data: allowedFields,
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

/**
 * @async
 * @function delete
 * @description Deletes a user by ID.
 * @param {string|number} id - User ID
 * @returns {Promise<Object>} The deleted user object with selected fields: id, email, name, createdAt, updatedAt
 * @throws {Error} Throws 404 "User not found" when Prisma error code P2025 (record not found)
 * @throws {Error} Throws other Prisma errors or runtime errors
 */
const deleteUser = async (id) => {
  try {
    return await prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const notFoundError = new Error('User not found');
      notFoundError.statusCode = 404;
      throw notFoundError;
    }
    throw error;
  }
};

const userService = {
  findAll,
  findById,
  findByEmail,
  create,
  update,
  delete: deleteUser,
};

module.exports = userService;