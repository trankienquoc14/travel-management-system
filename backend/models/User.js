const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  role_id: { type: DataTypes.INTEGER, allowNull: false },
  full_name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  status: { type: DataTypes.ENUM('Active', 'Inactive', 'Blocked'), defaultValue: 'Active' }
}, {
  tableName: 'users',
  timestamps: true, // Sequelize sẽ tự quản lý created_at, updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;