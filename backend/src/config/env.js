/**
 * `@module` config/env
 * `@description` Centralized environment configuration. Single source of truth for all environment variables.
 */

const dotenv = require('dotenv');

dotenv.config();

const getConfig = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const nodeEnv = process.env.NODE_ENV || 'development';

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && nodeEnv === 'production') {
    throw new Error('DATABASE_URL is required in production environment');
  }

  const logLevel = process.env.LOG_LEVEL || 'info';

  const dbPoolSize = process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : 10;

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