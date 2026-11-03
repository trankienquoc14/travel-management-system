const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  role_id: { type: DataTypes.INTEGER, allowNull: false },
  full_name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  avatar: { type: DataTypes.TEXT },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Other') },
  date_of_birth: { type: DataTypes.DATEONLY },
  address: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.ENUM('Active', 'Inactive', 'Blocked'), defaultValue: 'Active' }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
