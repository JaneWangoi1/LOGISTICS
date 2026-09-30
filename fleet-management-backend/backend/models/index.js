const sequelize = require('../config/database');

const User = require('./user.model');
const Truck = require('./truck.model');
const Driver = require('./driver.model');
const TruckDriverAssignment = require('./truckDriverAssignment.model');
const Customer = require('./customer.model');
const Trip = require('./trip.model');
const Payment = require('./payment.model');
const Expense = require('./expense.model');
const TruckDocument = require('./truckDocument.model');
const MaintenanceRecord = require('./maintenanceRecord.model');

// ---- Associations ----
// Every table relationship lives here, in one place, instead of scattered
// across model files — so the whole shape of the database is visible at a
// glance. Because `underscored: true` is set in config/database.js, a
// foreignKey named `truckId` here becomes an actual `truck_id` column in
// MySQL, matching database/schema.sql.

// A truck has many assignment records over time; each record must point to
// one truck. The foreignKey object is repeated identically on BOTH the
// hasMany and belongsTo side — Sequelize defines the column the first time
// it sees it, so if only one side says allowNull: false, it can lose to
// the other side's default. Matching them removes the ambiguity.
const REQUIRED = (name) => ({ foreignKey: { name, allowNull: false } });

Truck.hasMany(TruckDriverAssignment, REQUIRED('truckId'));
TruckDriverAssignment.belongsTo(Truck, REQUIRED('truckId'));

// Same idea from the driver's side — this is what powers "Driver History".
Driver.hasMany(TruckDriverAssignment, REQUIRED('driverId'));
TruckDriverAssignment.belongsTo(Driver, REQUIRED('driverId'));

// A customer can have many trips; each trip belongs to one customer (required).
Customer.hasMany(Trip, REQUIRED('customerId'));
Trip.belongsTo(Customer, REQUIRED('customerId'));

// A truck is used on many trips over time; each trip uses exactly one truck (required).
Truck.hasMany(Trip, REQUIRED('truckId'));
Trip.belongsTo(Truck, REQUIRED('truckId'));

// A driver runs many trips over time; each trip has exactly one driver (required).
Driver.hasMany(Trip, REQUIRED('driverId'));
Trip.belongsTo(Driver, REQUIRED('driverId'));

// A trip can receive more than one payment (e.g. deposit + balance);
// each payment must belong to exactly one trip.
Trip.hasMany(Payment, REQUIRED('tripId'));
Payment.belongsTo(Trip, REQUIRED('tripId'));

// Expenses are optionally linked to a trip and/or a truck — both genuinely
// nullable, since e.g. a routine service isn't tied to any specific trip.
// (Left as plain string foreignKeys, so they default to nullable.)
Trip.hasMany(Expense, { foreignKey: 'tripId' });
Expense.belongsTo(Trip, { foreignKey: 'tripId' });

Truck.hasMany(Expense, { foreignKey: 'truckId' });
Expense.belongsTo(Truck, { foreignKey: 'truckId' });

// A truck can have many documents (insurance, inspection, permit...) — each
// document must belong to a truck.
Truck.hasMany(TruckDocument, REQUIRED('truckId'));
TruckDocument.belongsTo(Truck, REQUIRED('truckId'));

// A truck can have many maintenance records over its lifetime — each record
// must belong to a truck.
Truck.hasMany(MaintenanceRecord, REQUIRED('truckId'));
MaintenanceRecord.belongsTo(Truck, REQUIRED('truckId'));

module.exports = {
  sequelize,
  User,
  Truck,
  Driver,
  TruckDriverAssignment,
  Customer,
  Trip,
  Payment,
  Expense,
  TruckDocument,
  MaintenanceRecord,
};
