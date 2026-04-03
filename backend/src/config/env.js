/**
 * `@module` config/env
 * `@description` Centralized environment configuration. Single source of truth for all environment variables.
 */

const dotenv = require('dotenv');

dotenv.config();

const DEFAULT_NODE_ENV = 'development';
const PRODUCTION_ENV = 'production';
const DEFAULT_PORT = 3000;
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_DB_POOL_SIZE = 10;

const getConfig = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const nodeEnv = process.env.NODE_ENV || DEFAULT_NODE_ENV;

  const parsedPort = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;
  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error(`Invalid PORT value: ${process.env.PORT}. PORT must be a positive integer.`);
  }
  const port = parsedPort;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && nodeEnv === PRODUCTION_ENV) {
    throw new Error('DATABASE_URL is required in production environment');
  }

  const logLevel = process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL;

  const parsedDbPoolSize = process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : DEFAULT_DB_POOL_SIZE;
  if (!Number.isInteger(parsedDbPoolSize) || parsedDbPoolSize <= 0) {
    throw new Error(`Invalid DB_POOL_SIZE value: ${process.env.DB_POOL_SIZE}. DB_POOL_SIZE must be a positive integer.`);
  }
  const dbPoolSize = parsedDbPoolSize;

  const awsRegion = process.env.AWS_REGION;
  const gcpProject = process.env.GCP_PROJECT;
  const azureSubscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
  
  return {
    JWT_SECRET,
    nodeEnv,
    port,
    databaseUrl,
    logLevel,
    dbPoolSize,
    awsRegion,
    gcpProject,
    azureSubscriptionId
  };
};

module.exports = { getConfig };
