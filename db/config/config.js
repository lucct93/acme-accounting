require('dotenv').config();

module.exports = {
  development: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5590,
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'task-dev',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },
  test: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5590,
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_TEST_NAME || 'task-test',
    logging: false,
  },
  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: false,
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
  }
};