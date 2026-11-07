const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  name: { type: DataTypes.STRING, allowNull: false },
  contactPerson: DataTypes.STRING,
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
}, { tableName: 'customers', updatedAt: false });

module.exports = Customer;
