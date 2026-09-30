const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  category: {
    type: DataTypes.ENUM(
      'FUEL', 'MAINTENANCE', 'DRIVER_ALLOWANCE', 'TOLLS',
      'PERMITS', 'PARKING', 'REPAIRS', 'OTHER'
    ),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  description: DataTypes.STRING,
  receiptPath: DataTypes.STRING, // path/URL to an uploaded receipt image, once file uploads are wired up
  expenseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'expenses',
  updatedAt: false,
});

module.exports = Expense;
