const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Driver = sequelize.define('Driver', {
  name: { type: DataTypes.STRING, allowNull: false },
  phone: DataTypes.STRING,
  idNumber: { type: DataTypes.STRING, unique: true },
  licenseNumber: { type: DataTypes.STRING, unique: true },
  licenseClass: DataTypes.STRING,
  licenseExpiry: DataTypes.DATEONLY,
  employmentStatus: { type: DataTypes.ENUM('ACTIVE', 'ON_LEAVE', 'TERMINATED'), allowNull: false, defaultValue: 'ACTIVE' },
}, { tableName: 'drivers' });

module.exports = Driver;
