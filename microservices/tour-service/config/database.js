const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log("DB CONFIG:", { host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, name: process.env.DB_NAME });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'travel_management', 
  process.env.DB_USER || 'root', 
  process.env.DB_PASS || process.env.DB_PASSWORD || '', 
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;