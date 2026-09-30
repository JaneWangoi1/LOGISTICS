const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Just one role for now (ADMIN), but keeping `role` as its own column —
// rather than assuming every user is an admin — means adding a second role
// like ACCOUNTANT later is a data change, not a rebuild.
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false, // stored as a bcrypt hash once auth is wired up in Phase 2 — never plain text
  },
  role: {
    type: DataTypes.ENUM('ADMIN'),
    allowNull: false,
    defaultValue: 'ADMIN',
  },
}, {
  tableName: 'users',
});

module.exports = User;
