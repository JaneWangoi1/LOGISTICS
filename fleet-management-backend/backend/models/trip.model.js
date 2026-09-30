const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trip = sequelize.define('Trip', {
  origin: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cargoDescription: DataTypes.STRING,
  cargoWeightTonnes: DataTypes.DECIMAL(10, 2),
  departureDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  expectedReturnDate: DataTypes.DATEONLY,
  actualReturnDate: DataTypes.DATEONLY, // filled in when the trip is marked complete
  agreedRevenue: {
    type: DataTypes.DECIMAL(12, 2), // DECIMAL, not FLOAT — money should never use floating point
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('ONGOING', 'COMPLETED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'ONGOING',
  },
}, {
  tableName: 'trips',
});

module.exports = Trip;
