const { Op } = require('sequelize');
const { Trip, Expense, Payment, Truck, Customer } = require('../models');

// Every page that shows money (Dashboard, Income, Expenses, Reports) goes
// through this file, so the numbers cannot disagree between pages.

// A cancelled trip earns nothing, so it never counts as income or as money
// still owed. Expenses already spent on it still count as costs.
const NOT_CANCELLED = { [Op.ne]: 'CANCELLED' };

const total = (rows, pick) => rows.reduce((sum, row) => sum + Number(pick(row)), 0);
const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null); // one decimal place
const isReceived = (payment) => payment.paymentStatus === 'PAID' || payment.paymentStatus === 'PARTIAL';

// ---- date ranges: ?from=2026-10-01&to=2026-10-31, either end optional ----
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

function parseRange(query = {}) {
  const start = query.from || null;
  const end = query.to || null;
  for (const value of [start, end]) {
    if (value && (!DATE_FORMAT.test(value) || Number.isNaN(Date.parse(value)))) {
      return { error: 'Dates must look like 2026-09-30.' };
    }
  }
  if (start && end && start > end) return { error: 'The start date must come before the end date.' };
  return { range: { start, end } };
}

function dateCondition(range) {
  const { start, end } = range || {};
  if (start && end) return { [Op.between]: [start, end] };
  if (start) return { [Op.gte]: start };
  if (end) return { [Op.lte]: end };
  return undefined;
}

// Adds `column` to a where-clause only when the range actually has a bound.
function withRange(where, column, range) {
  const condition = dateCondition(range);
  return condition ? { ...where, [column]: condition } : where;
}

// ---- totals ----
// Income is the agreed price of every trip that departed in the range.
async function periodTotals(range) {
  const tripRows = await Trip.findAll({ where: withRange({ status: NOT_CANCELLED }, 'departureDate', range) });
  const expenseRows = await Expense.findAll({ where: withRange({}, 'expenseDate', range) });
  const income = total(tripRows, (t) => t.agreedRevenue);
  const expenses = total(expenseRows, (e) => e.amount);
  const profit = income - expenses;
  return { income, expenses, profit, margin: percent(profit, income), tripRows, expenseRows };
}

// One row per non-cancelled trip, with what has been paid and what is still owed.
async function incomeRows({ range, truckId } = {}) {
  const where = withRange({ status: NOT_CANCELLED }, 'departureDate', range);
  if (truckId) where.truckId = truckId;

  const trips = await Trip.findAll({
    where,
    include: [{ model: Customer }, { model: Truck, attributes: ['id', 'registrationNo'] }, { model: Payment }],
    order: [['departureDate', 'DESC'], ['id', 'DESC']],
  });

  return trips.map((trip) => {
    const amount = Number(trip.agreedRevenue);
    const received = total((trip.Payments || []).filter(isReceived), (p) => p.amount);
    return {
      id: trip.id,
      status: trip.status,
      origin: trip.origin,
      destination: trip.destination,
      cargoDescription: trip.cargoDescription,
      cargoWeightTonnes: trip.cargoWeightTonnes,
      departureDate: trip.departureDate,
      expectedReturnDate: trip.expectedReturnDate,
      actualReturnDate: trip.actualReturnDate,
      notes: trip.notes,
      customer: trip.Customer?.name || '',
      truckId: trip.truckId,
      registrationNo: trip.Truck?.registrationNo || '',
      amount,
      received,
      balance: Math.max(amount - received, 0),
    };
  });
}

// Trips with a balance owed. Completed-but-unpaid ones come first: those are the ones to chase.
async function unpaidTrips() {
  const rows = await incomeRows();
  return rows
    .filter((row) => row.balance > 0)
    .map((row) => ({
      tripId: row.id,
      origin: row.origin,
      destination: row.destination,
      customer: row.customer,
      tripStatus: row.status,
      outstanding: row.balance,
    }))
    .sort(
      (a, b) =>
        (a.tripStatus === 'COMPLETED' ? 0 : 1) - (b.tripStatus === 'COMPLETED' ? 0 : 1) ||
        b.outstanding - a.outstanding
    );
}

async function outstandingTotal() {
  return total(await unpaidTrips(), (t) => t.outstanding);
}

// Income, expenses, profit and margin for every truck, idle ones included.
async function profitByTruck(range) {
  const trucks = await Truck.findAll({ order: [['registrationNo', 'ASC']] });
  const [trips, expenseRows] = await Promise.all([
    Trip.findAll({ where: withRange({ status: NOT_CANCELLED }, 'departureDate', range) }),
    Expense.findAll({ where: withRange({}, 'expenseDate', range) }),
  ]);

  return trucks.map((truck) => {
    const income = total(trips.filter((t) => t.truckId === truck.id), (t) => t.agreedRevenue);
    const expenses = total(expenseRows.filter((e) => e.truckId === truck.id), (e) => e.amount);
    const profit = income - expenses;
    return { truckId: truck.id, registrationNo: truck.registrationNo, income, expenses, profit, margin: percent(profit, income) };
  });
}

// Where the money went: expense totals per category with each one's share.
function categoryBreakdown(expenseRows) {
  const sums = {};
  for (const e of expenseRows) sums[e.category] = (sums[e.category] || 0) + Number(e.amount);
  const grand = Object.values(sums).reduce((a, b) => a + b, 0);
  return Object.entries(sums)
    .map(([category, amount]) => ({ category, total: amount, share: percent(amount, grand) }))
    .sort((a, b) => b.total - a.total);
}

// Income and expenses month by month (empty months included so the chart has no gaps).
function monthlySeries(range, tripRows, expenseRows) {
  const buckets = new Map();
  const bucket = (key) => {
    if (!buckets.has(key)) buckets.set(key, { month: key, income: 0, expenses: 0 });
    return buckets.get(key);
  };
  tripRows.forEach((t) => { bucket(t.departureDate.slice(0, 7)).income += Number(t.agreedRevenue); });
  expenseRows.forEach((e) => { bucket(e.expenseDate.slice(0, 7)).expenses += Number(e.amount); });

  const keys = [...buckets.keys()].sort();
  const first = range?.start ? range.start.slice(0, 7) : keys[0];
  const last = range?.end ? range.end.slice(0, 7) : keys[keys.length - 1];
  if (!first || !last) return [];

  const series = [];
  let [year, month] = first.split('-').map(Number);
  const [lastYear, lastMonth] = last.split('-').map(Number);
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const b = buckets.get(key) || { month: key, income: 0, expenses: 0 };
    series.push({ ...b, profit: b.income - b.expenses });
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return series.slice(-24);
}

module.exports = {
  total, parseRange, withRange, periodTotals, incomeRows, unpaidTrips, outstandingTotal,
  profitByTruck, categoryBreakdown, monthlySeries,
};
