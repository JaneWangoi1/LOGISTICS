const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Truck = sequelize.define('Truck', {
  registrationNo: { type: DataTypes.STRING, allowNull: false, unique: true },
  make: DataTypes.STRING,
  model: DataTypes.STRING,
  year: DataTypes.INTEGER,
  capacityTonnes: DataTypes.DECIMAL(8, 2),
  mileage: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE'), allowNull: false, defaultValue: 'AVAILABLE' },
}, { tableName: 'trucks' });

module.exports = Truck;
