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

const REQUIRED = (name) => ({ foreignKey: { name, allowNull: false } });

Truck.hasMany(TruckDriverAssignment, REQUIRED('truckId'));
TruckDriverAssignment.belongsTo(Truck, REQUIRED('truckId'));

Driver.hasMany(TruckDriverAssignment, REQUIRED('driverId'));
TruckDriverAssignment.belongsTo(Driver, REQUIRED('driverId'));

Customer.hasMany(Trip, REQUIRED('customerId'));
Trip.belongsTo(Customer, REQUIRED('customerId'));

Truck.hasMany(Trip, REQUIRED('truckId'));
Trip.belongsTo(Truck, REQUIRED('truckId'));

Driver.hasMany(Trip, REQUIRED('driverId'));
Trip.belongsTo(Driver, REQUIRED('driverId'));

Trip.hasMany(Payment, REQUIRED('tripId'));
Payment.belongsTo(Trip, REQUIRED('tripId'));

Trip.hasMany(Expense, { foreignKey: 'tripId' });
Expense.belongsTo(Trip, { foreignKey: 'tripId' });

Truck.hasMany(Expense, { foreignKey: 'truckId' });
Expense.belongsTo(Truck, { foreignKey: 'truckId' });

Truck.hasMany(TruckDocument, REQUIRED('truckId'));
TruckDocument.belongsTo(Truck, REQUIRED('truckId'));

Truck.hasMany(MaintenanceRecord, REQUIRED('truckId'));
MaintenanceRecord.belongsTo(Truck, REQUIRED('truckId'));

module.exports = {
  sequelize, User, Truck, Driver, TruckDriverAssignment, Customer,
  Trip, Payment, Expense, TruckDocument, MaintenanceRecord,
};
