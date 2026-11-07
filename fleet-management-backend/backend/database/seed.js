require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize, User, Truck, Driver, TruckDriverAssignment, Customer, Trip, Payment, Expense,
  TruckDocument, MaintenanceRecord,
} = require('../models');
const { localDateStr } = require('../utils/status');

// Wipes the database and loads a realistic demo fleet: 6 trucks, 6 drivers and
// about six months of trips, payments and expenses, with a few expired
// documents and overdue services so every screen has something to show.
//   node database/seed.js               demo data
//   node database/seed.js --admin-only  just the admin login, nothing else
// All dates are relative to today, so "this month" always has data.
// Never run this against real company data: it deletes everything first.

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return localDateStr(d);
};

// A tiny deterministic random generator: the same demo data every run.
let state = 20260101;
const rand = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const between = (min, max) => Math.round((min + rand() * (max - min)) / 500) * 500;

const TRUCKS = [
  { registrationNo: 'KDA 123A', make: 'Mercedes', model: 'Actros 2644', year: 2021, capacityTonnes: 28, mileage: 245800, status: 'ON_TRIP' },
  { registrationNo: 'KDB 456B', make: 'Isuzu', model: 'FVZ 1400', year: 2020, capacityTonnes: 14, mileage: 198400, status: 'AVAILABLE' },
  { registrationNo: 'KCA 777X', make: 'Scania', model: 'R450', year: 2019, capacityTonnes: 30, mileage: 428900, status: 'AVAILABLE' },
  { registrationNo: 'KDD 111A', make: 'Hino', model: '500 Series', year: 2018, capacityTonnes: 15, mileage: 312600, status: 'MAINTENANCE' },
  { registrationNo: 'KBZ 999Z', make: 'Isuzu', model: 'FRR', year: 2022, capacityTonnes: 8, mileage: 96700, status: 'ON_TRIP' },
  { registrationNo: 'KCH 202M', make: 'Mitsubishi', model: 'Fuso Fighter', year: 2017, capacityTonnes: 10, mileage: 389200, status: 'AVAILABLE' },
];

// Driver i is assigned to truck i.
const DRIVERS = [
  { name: 'John Kamau', phone: '0700 111 222', idNumber: '23456781', licenseNumber: 'DL-001234', licenseClass: 'CE', licenceDays: 400 },
  { name: 'Peter Otieno', phone: '0711 222 333', idNumber: '24567892', licenseNumber: 'DL-002345', licenseClass: 'CE', licenceDays: 18 },
  { name: 'Mary Achieng', phone: '0722 333 444', idNumber: '25678903', licenseNumber: 'DL-003456', licenseClass: 'CE', licenceDays: 700 },
  { name: 'Samuel Mwangi', phone: '0733 444 555', idNumber: '26789014', licenseNumber: 'DL-004567', licenseClass: 'C', licenceDays: -6 },
  { name: 'David Kiprop', phone: '0744 555 666', idNumber: '27890125', licenseNumber: 'DL-005678', licenseClass: 'CE', licenceDays: 520 },
  { name: 'Grace Njeri', phone: '0755 666 777', idNumber: '28901236', licenseNumber: 'DL-006789', licenseClass: 'C', licenceDays: 300, employmentStatus: 'ON_LEAVE' },
];

const CUSTOMERS = ['ABC Logistics', 'Bidco Kenya', 'Simba Cement', 'Unga Group', 'EABL'];

const ROUTES = [
  { from: 'Nairobi', to: 'Mombasa', pay: [150000, 195000], fuel: [38000, 46000], tolls: 1800, wages: [7000, 9000], days: 4 },
  { from: 'Mombasa', to: 'Nairobi', pay: [140000, 185000], fuel: [36000, 44000], tolls: 1800, wages: [7000, 9000], days: 4 },
  { from: 'Nairobi', to: 'Kampala', pay: [280000, 330000], fuel: [68000, 80000], tolls: 6000, wages: [14000, 18000], permit: 8500, days: 7 },
  { from: 'Nakuru', to: 'Nairobi', pay: [110000, 135000], fuel: [18000, 24000], tolls: 900, wages: [5000, 6500], days: 2 },
  { from: 'Nairobi', to: 'Kisumu', pay: [140000, 170000], fuel: [30000, 38000], tolls: 1500, wages: [6500, 8500], days: 3 },
  { from: 'Nairobi', to: 'Eldoret', pay: [170000, 200000], fuel: [34000, 42000], tolls: 1200, wages: [7000, 9000], days: 3 },
];

// days until expiry for [insurance, inspection, logbook] on each truck
const DOCS = [
  [210, 95, 1200],   // KDA 123A: all fine
  [12, -5, 900],     // KDB 456B: insurance expiring, inspection expired
  [160, 45, 1400],   // KCA 777X: fine
  [-12, 130, 800],   // KDD 111A: insurance expired
  [300, 24, 1000],   // KBZ 999Z: inspection expiring
  [88, 7, 1500],     // KCH 202M: inspection expiring
];

async function seed() {
  await sequelize.sync({ force: true });

  const hashedPassword = await bcrypt.hash('changeme123', 10);
  await User.create({ name: 'Admin', email: 'admin@fleetco.com', password: hashedPassword, role: 'ADMIN' });

  if (process.argv.includes('--admin-only')) {
    console.log('Seeded the admin login only.');
    console.log('Login with email: admin@fleetco.com / password: changeme123 (change this before real use)');
    await sequelize.close();
    return;
  }

  const trucks = [];
  for (const t of TRUCKS) trucks.push(await Truck.create(t));

  const drivers = [];
  for (const d of DRIVERS) {
    const { licenceDays, ...fields } = d;
    drivers.push(await Driver.create({ ...fields, licenseExpiry: day(licenceDays) }));
  }
  for (let i = 0; i < trucks.length; i++) {
    await TruckDriverAssignment.create({ truckId: trucks[i].id, driverId: drivers[i].id, assignedFrom: day(-200), assignedTo: null });
  }

  const customers = [];
  for (const name of CUSTOMERS) customers.push(await Customer.create({ name }));

  // ---- two live trips (their trucks are ON_TRIP) ----
  const live = [
    { truck: 0, route: 2, customer: 0, offset: 0, revenue: 305000, paid: 150000 },
    { truck: 4, route: 4, customer: 1, offset: -1, revenue: 155000, paid: 0 },
  ];
  for (const l of live) {
    const r = ROUTES[l.route];
    const trip = await Trip.create({
      customerId: customers[l.customer].id, truckId: trucks[l.truck].id, driverId: drivers[l.truck].id,
      origin: r.from, destination: r.to, cargoDescription: 'General cargo', cargoWeightTonnes: 18,
      departureDate: day(l.offset), expectedReturnDate: day(l.offset + r.days), agreedRevenue: l.revenue, status: 'ONGOING',
    });
    if (l.paid) await Payment.create({ tripId: trip.id, amount: l.paid, paymentStatus: 'PARTIAL', paymentDate: day(l.offset) });
    await Expense.create({ tripId: trip.id, truckId: trucks[l.truck].id, category: 'FUEL', amount: between(r.fuel[0], r.fuel[1]), expenseDate: day(l.offset), description: `Fuel, ${r.from} to ${r.to}` });
  }

  // ---- about six months of finished trips ----
  for (let t = 0; t < trucks.length; t++) {
    for (let m = 0; m < 6; m++) {
      for (const slot of [5 + t, 17 + t]) {
        if (slot === 17 + t && rand() < 0.35) continue; // not every truck runs twice a month
        const offset = -(m * 30 + slot);
        const age = -offset;
        const r = ROUTES[Math.floor(rand() * ROUTES.length)];
        const customer = customers[Math.floor(rand() * customers.length)];
        const revenue = between(r.pay[0], r.pay[1]);

        const trip = await Trip.create({
          customerId: customer.id, truckId: trucks[t].id, driverId: drivers[t].id,
          origin: r.from, destination: r.to, cargoDescription: 'General cargo', cargoWeightTonnes: between(6000, 14000) / 1000,
          departureDate: day(offset), expectedReturnDate: day(Math.min(0, offset + r.days)),
          actualReturnDate: day(Math.min(0, offset + r.days)), agreedRevenue: revenue, status: 'COMPLETED',
        });

        // Older trips are paid; recent ones are partly or wholly outstanding.
        const payDate = day(Math.min(0, offset + r.days + 7));
        if (age > 45) {
          await Payment.create({ tripId: trip.id, amount: revenue, paymentStatus: 'PAID', paymentDate: payDate });
        } else if (age > 12) {
          if (rand() < 0.7) await Payment.create({ tripId: trip.id, amount: revenue, paymentStatus: 'PAID', paymentDate: payDate });
          else await Payment.create({ tripId: trip.id, amount: Math.round(revenue * 0.6), paymentStatus: 'PARTIAL', paymentDate: payDate });
        } else if (rand() < 0.5) {
          await Payment.create({ tripId: trip.id, amount: Math.round(revenue * 0.5), paymentStatus: 'PARTIAL', paymentDate: payDate });
        }

        const spent = day(Math.min(0, offset + 1));
        const costs = [
          ['FUEL', between(r.fuel[0], r.fuel[1]), `Fuel, ${r.from} to ${r.to}`],
          ['TOLLS', r.tolls, null],
          ['DRIVER_ALLOWANCE', between(r.wages[0], r.wages[1]), 'Driver wages'],
        ];
        if (r.permit) costs.push(['PERMITS', r.permit, 'Transit permit']);
        for (const [category, amount, description] of costs) {
          await Expense.create({ tripId: trip.id, truckId: trucks[t].id, category, amount, expenseDate: spent, description });
        }
      }
    }
  }

  // ---- costs that belong to a truck but not to a trip, and one general cost ----
  const truckCosts = [
    [3, 'REPAIRS', 85000, -12, 'Gearbox repair'],
    [1, 'MAINTENANCE', 18500, -24, 'Full service'],
    [2, 'REPAIRS', 42000, -40, 'Two new tyres'],
    [5, 'MAINTENANCE', 22000, -55, 'Full service'],
    [0, 'MAINTENANCE', 16000, -33, 'Oil and filters'],
  ];
  for (const [t, category, amount, offset, description] of truckCosts) {
    await Expense.create({ truckId: trucks[t].id, category, amount, expenseDate: day(offset), description });
  }
  await Expense.create({ category: 'OTHER', amount: 9500, expenseDate: day(-9), description: 'Fleet tracking subscription' });

  // ---- compliance documents ----
  const types = [['INSURANCE', 'INS'], ['INSPECTION', 'NTSA'], ['LOGBOOK', 'LB']];
  for (let t = 0; t < trucks.length; t++) {
    for (let k = 0; k < types.length; k++) {
      const plate = TRUCKS[t].registrationNo.replace(/\s/g, '');
      await TruckDocument.create({
        truckId: trucks[t].id, documentType: types[k][0],
        documentNumber: `${types[k][1]}-2026-${1000 + t * 37 + k * 11}-${plate}`,
        expiryDate: day(DOCS[t][k]),
      });
    }
  }

  // ---- service history (some due, one superseded) ----
  const service = [
    [0, 'Oil change', -70, 238000, 248000, null],
    [0, 'Tyre rotation', -30, 242000, null, 60],
    [1, 'Oil change', -200, 180000, 185000, null],   // replaced by the next one
    [1, 'Oil change', -100, 188000, 195000, null],   // truck is at 198,400 so this is due
    [2, 'Brake service', -50, 420000, 450000, -3],   // due by date
    [3, 'Gearbox overhaul', -12, 312000, 340000, 180],
    [4, 'Oil change', -40, 90000, 106700, null],
    [5, 'Oil change', -80, 370000, 380000, null],    // due
  ];
  for (const [t, serviceType, offset, atMileage, dueMileage, dueDays] of service) {
    await MaintenanceRecord.create({
      truckId: trucks[t].id, serviceType, serviceDate: day(offset), mileageAtService: atMileage,
      nextServiceDueMileage: dueMileage, nextServiceDueDate: dueDays == null ? null : day(dueDays),
      cost: between(12000, 30000),
    });
  }

  console.log('Demo data loaded: 6 trucks, 6 drivers, about 6 months of trips, payments, expenses, documents and servicing.');
  console.log('Login with email: admin@fleetco.com / password: changeme123 (change this before real use)');
  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
