const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tour = sequelize.define('Tour', {
  tour_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tour_name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  destination: { type: DataTypes.STRING(255) },
  duration_days: { type: DataTypes.INTEGER },
  base_price: { type: DataTypes.DECIMAL(15, 2) },
  image_url: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' },
  created_by: { type: DataTypes.INTEGER }
}, {
  tableName: 'tours',
  timestamps: false // Trong SQL của bạn bảng này không có cột created_at, updated_at
});

module.exports = Tour;