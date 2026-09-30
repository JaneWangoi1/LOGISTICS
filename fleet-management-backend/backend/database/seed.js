require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Truck, Driver, Customer, Trip, Payment, Expense } = require('../models');

// Populates a handful of realistic records so there's something to look at
// once the Trucks/Drivers/Trips screens exist. Safe to re-run — it wipes
// and recreates every table first (force: true), so never run this against
// real company data once you're live.
async function seed() {
  await sequelize.sync({ force: true });

  // bcrypt.hash() never stores the plain password — it stores a one-way
  // hash. Even with full database access, nobody can read the original
  // password back out; login works by re-hashing what's typed in and
  // comparing hashes, which is what auth.controller.js does.
  const hashedPassword = await bcrypt.hash('changeme123', 10);
  await User.create({
    name: 'Admin',
    email: 'admin@fleetco.com',
    password: hashedPassword,
    role: 'ADMIN',
  });

  const truck = await Truck.create({
    registrationNo: 'KDA 123A',
    make: 'Mercedes',
    model: 'Actros',
    year: 2021,
    mileage: 245800,
    status: 'ON_TRIP',
  });

  const driver = await Driver.create({
    name: 'John Kamau',
    phone: '0700000000',
    licenseNumber: 'DL-001234',
    licenseClass: 'CE',
    licenseExpiry: '2027-06-01',
  });

  const customer = await Customer.create({
    name: 'ABC Logistics',
    contactPerson: 'Grace Wanjiru',
    phone: '0711000000',
  });

  const trip = await Trip.create({
    customerId: customer.id,
    truckId: truck.id,
    driverId: driver.id,
    origin: 'Nairobi',
    destination: 'Kampala',
    cargoDescription: 'General cargo',
    cargoWeightTonnes: 20,
    departureDate: '2026-09-10',
    expectedReturnDate: '2026-09-14',
    agreedRevenue: 300000,
    status: 'ONGOING',
  });

  await Payment.create({
    tripId: trip.id,
    amount: 150000,
    paymentStatus: 'PARTIAL',
    paymentDate: '2026-09-10',
  });

  await Expense.create({
    tripId: trip.id,
    truckId: truck.id,
    category: 'FUEL',
    amount: 35000,
    expenseDate: '2026-09-10',
    description: 'Fuel for the Nairobi-Kampala leg',
  });

  console.log('Seed data created: 1 admin user, 1 truck, 1 driver, 1 customer, 1 trip, 1 payment, 1 expense.');
  console.log('Login with email: admin@fleetco.com / password: changeme123 (change this before real use)');
  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
