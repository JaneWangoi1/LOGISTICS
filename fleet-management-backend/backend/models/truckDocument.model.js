const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TruckDocument = sequelize.define('TruckDocument', {
  documentType: {
    type: DataTypes.ENUM('INSURANCE', 'INSPECTION', 'PERMIT', 'LICENSE', 'OTHER'),
    allowNull: false,
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  filePath: DataTypes.STRING,
}, {
  tableName: 'truck_documents',
  updatedAt: false,
});

module.exports = TruckDocument;
