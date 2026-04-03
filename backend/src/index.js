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

dotenv.config();

const app = express();
const { port: PORT } = getConfig();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/permissions', permissionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorMiddleware);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND'
    }
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;