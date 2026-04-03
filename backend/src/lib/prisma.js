/**
 * @module prisma
 * @description Prisma client wrapper/initializer for database connections
 */
const { PrismaClient } = require('@prisma/client');
const { getConfig } = require('../config/env');

const { nodeEnv } = getConfig();

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
