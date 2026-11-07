const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trip = sequelize.define('Trip', {
  origin: { type: DataTypes.STRING, allowNull: false },
  destination: { type: DataTypes.STRING, allowNull: false },
  cargoDescription: DataTypes.STRING,
  cargoWeightTonnes: DataTypes.DECIMAL(10, 2),
  departureDate: { type: DataTypes.DATEONLY, allowNull: false },
  expectedReturnDate: DataTypes.DATEONLY,
  actualReturnDate: DataTypes.DATEONLY,
  agreedRevenue: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  notes: DataTypes.STRING,
  status: { type: DataTypes.ENUM('ONGOING', 'COMPLETED', 'CANCELLED'), allowNull: false, defaultValue: 'ONGOING' },
}, { tableName: 'trips' });

module.exports = Trip;
