const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TruckDriverAssignment = sequelize.define('TruckDriverAssignment', {
  assignedFrom: { type: DataTypes.DATEONLY, allowNull: false },
  assignedTo: { type: DataTypes.DATEONLY, allowNull: true },
}, { tableName: 'truck_driver_assignments', timestamps: false });

module.exports = TruckDriverAssignment;
