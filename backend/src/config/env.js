const dotenv = require('dotenv');

dotenv.config();

const getConfig = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return {
    JWT_SECRET,
    nodeEnv: process.env.NODE_ENV || 'development'
  };
};

module.exports = { getConfig };