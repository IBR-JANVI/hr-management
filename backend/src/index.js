/**
 * @module backend/server
 * @description Main Express server entry point - initializes and configures the HR Management API server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { getConfig } = require('./config/env');
const { logger } = require('./config/logger');
const errorMiddleware = require('./core/middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const permissionRoutes = require('./routes/permission.routes');

dotenv.config();

const app = express();
const { port: PORT } = getConfig();

app.use(helmet());
app.use(cors());
app.use(morgan('dev', {
  stream: {
    write: msg => logger.info(msg.trim())
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const AppError = require('./core/errors/AppError');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/permissions', permissionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
  const err = new AppError('Route not found', 404);
  err.code = 'NOT_FOUND';
  next(err);
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;