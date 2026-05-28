require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'new_api',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },

  apiKey: process.env.API_KEY_PROXY || '',
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30', 10) * 1000,
  maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '5', 10),
  logLevel: process.env.LOG_LEVEL || 'info'
};
