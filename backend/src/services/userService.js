/**
 * `@module` services/user
 * `@description` User service handling CRUD operations for user entities.
 */

const prisma = require('../lib/prisma');

export const userService = {
  async findAll({ page = 1, limit = 20 }) {
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
  },

  async findById(id) {
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
  },

  async findByEmail(email) {
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
  },

  async create(data) {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async update(id, data) {
    const allowedFields = {};
    if (data.name !== undefined) allowedFields.name = data.name;
    if (data.email !== undefined) allowedFields.email = data.email;

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
  },

  async delete(id) {
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
  },
};

module.exports = { userService };