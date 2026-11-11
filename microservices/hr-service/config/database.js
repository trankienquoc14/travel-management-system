const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'travel_management', 
  process.env.DB_USER || 'root', 
  process.env.DB_PASS || process.env.DB_PASSWORD || '', 
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false, // Tắt log query cho đỡ rối console
    dialectOptions: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost')) ? {
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      }
    } : {}
  }
);

module.exports = sequelize;