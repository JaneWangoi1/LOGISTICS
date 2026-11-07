const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaintenanceRecord = sequelize.define('MaintenanceRecord', {
  serviceType: { type: DataTypes.STRING, allowNull: false },
  cost: DataTypes.DECIMAL(12, 2),
  serviceDate: { type: DataTypes.DATEONLY, allowNull: false },
  mileageAtService: DataTypes.INTEGER,
  nextServiceDueMileage: DataTypes.INTEGER,
  nextServiceDueDate: DataTypes.DATEONLY,
  notes: DataTypes.STRING,
}, { tableName: 'maintenance_records', updatedAt: false });

module.exports = MaintenanceRecord;
