const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  paymentStatus: {
    type: DataTypes.ENUM('PENDING', 'PARTIAL', 'PAID'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  paymentDate: DataTypes.DATEONLY,
  invoiceReference: DataTypes.STRING,
}, {
  tableName: 'payments',
  updatedAt: false,
});

module.exports = Payment;
