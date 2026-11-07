const { Op } = require('sequelize');
const { Trip, Expense, Payment, Truck } = require('../models');

// "2026-09" -> { start: "2026-09-01", end: "2026-09-30" }
function getMonthRange(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const start = `${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month = last day of this one
  const end = `${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Money actually received for a trip: payments marked PAID or PARTIAL.
// PENDING payments haven't come in yet, so they don't count. Expects the
// trip to have been loaded with its Payments.
function amountReceived(trip) {
  return (trip.Payments || [])
    .filter((p) => p.paymentStatus === 'PAID' || p.paymentStatus === 'PARTIAL')
    .reduce((s, p) => s + Number(p.amount), 0);
}

// What a customer still owes on a trip (never negative).
function tripBalance(trip) {
  return Math.max(Number(trip.agreedRevenue) - amountReceived(trip), 0);
}

// The calculations below are shared by the Finances page and the Dashboard,
// so both always show the same numbers.

// Revenue/expenses/profit are scoped to the given month. Outstanding
// payments is deliberately NOT month-scoped — money owed from an August
// trip is still owed in September, so it's tracked against all trips
// regardless of when they happened.
async function calculateSummary(month) {
  const { start, end } = getMonthRange(month);

  const trips = await Trip.findAll({ where: { departureDate: { [Op.between]: [start, end] } } });
  const revenue = trips.reduce((sum, t) => sum + Number(t.agreedRevenue), 0);

  const expenses = await Expense.findAll({ where: { expenseDate: { [Op.between]: [start, end] } } });
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const allTrips = await Trip.findAll({ include: [{ model: Payment }] });
  const outstandingPayments = allTrips.reduce((sum, trip) => sum + tripBalance(trip), 0);

  return {
    month,
    revenue,
    expenses: totalExpenses,
    profit: revenue - totalExpenses,
    outstandingPayments,
  };
}

// Revenue/expenses/profit for every truck. With a month it's scoped to
// that month; without one it's all-time.
async function calculateByTruck(month) {
  const trucks = await Truck.findAll({ order: [['registrationNo', 'ASC']] });

  let tripWhere = {};
  let expenseWhere = {};
  if (month) {
    const { start, end } = getMonthRange(month);
    tripWhere = { departureDate: { [Op.between]: [start, end] } };
    expenseWhere = { expenseDate: { [Op.between]: [start, end] } };
  }

  return Promise.all(
    trucks.map(async (truck) => {
      const trips = await Trip.findAll({ where: { ...tripWhere, truckId: truck.id } });
      const revenue = trips.reduce((sum, t) => sum + Number(t.agreedRevenue), 0);

      const expenses = await Expense.findAll({ where: { ...expenseWhere, truckId: truck.id } });
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        truckId: truck.id,
        registrationNo: truck.registrationNo,
        revenue,
        expenses: totalExpenses,
        profit: revenue - totalExpenses,
      };
    })
  );
}

// GET /api/finances/summary?month=YYYY-MM (defaults to the current month)
async function getSummary(req, res) {
  try {
    const month = req.query.month || currentMonthStr();
    res.json(await calculateSummary(month));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not calculate the finance summary.' });
  }
}

// GET /api/finances/by-truck?month=YYYY-MM (month optional — all-time if omitted)
async function getByTruck(req, res) {
  try {
    res.json(await calculateByTruck(req.query.month));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not calculate truck profitability.' });
  }
}

module.exports = {
  getSummary,
  getByTruck,
  calculateSummary,
  calculateByTruck,
  amountReceived,
  tripBalance,
  getMonthRange,
  currentMonthStr,
};
