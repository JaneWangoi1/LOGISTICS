const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Why this table exists: if we only stored a single "current truck" field
// on the driver, every reassignment would overwrite it and the history
// would be lost. Instead, each row here is one assignment period — a
// driver's full history is just every row where driverId matches them,
// and "currently assigned" just means assignedTo is still NULL.
const TruckDriverAssignment = sequelize.define('TruckDriverAssignment', {
  assignedFrom: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  assignedTo: {
    type: DataTypes.DATEONLY,
    allowNull: true, // NULL = this assignment is still active today
  },
}, {
  tableName: 'truck_driver_assignments',
  timestamps: false, // assignedFrom/assignedTo already tell the story; no extra dates needed
});

module.exports = TruckDriverAssignment;
