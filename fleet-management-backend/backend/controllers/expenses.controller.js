const { Expense, Trip, Truck } = require('../models');
const { pick } = require('../utils/input');
const { parseRange, withRange, total } = require('../utils/finance');

const CATEGORIES = Expense.rawAttributes.category.values;
const include = [
  { model: Trip, attributes: ['id', 'origin', 'destination'] },
  { model: Truck, attributes: ['id', 'registrationNo'] },
];

// GET /api/expenses?truckId=&tripId=&category=&from=&to=
// Returns the matching expenses, their total, and totals per category. The
// per-category totals deliberately ignore the category filter, so the category
// chips on the page stay visible and you can hop between them.
async function getExpenses(req, res) {
  try {
    const parsed = parseRange(req.query);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const { truckId, tripId, category } = req.query;
    const base = withRange({}, 'expenseDate', parsed.range);
    if (truckId) base.truckId = truckId;
    if (tripId) base.tripId = tripId;

    const expenses = await Expense.findAll({
      where: category ? { ...base, category } : base,
      include,
      order: [['expenseDate', 'DESC'], ['id', 'DESC']],
    });
    const forChips = category ? await Expense.findAll({ where: base, attributes: ['category', 'amount'] }) : expenses;

    const byCategory = {};
    for (const e of forChips) byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);

    res.json({ expenses, total: total(expenses, (e) => e.amount), count: expenses.length, byCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load expenses.' });
  }
}

// POST /api/expenses. tripId and truckId are both optional. When an expense is
// tied to a trip, it is also stamped with that trip's truck, so "profit by
// truck" is a simple sum instead of a join through trips.
async function createExpense(req, res) {
  try {
    const { tripId, truckId, category, amount, description, expenseDate } = req.body;
    if (!category || !amount || !expenseDate) {
      return res.status(400).json({ error: 'Category, amount, and date are all required.' });
    }
    if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Choose a valid category.' });
    if (Number(amount) <= 0) return res.status(400).json({ error: 'Enter an amount greater than zero.' });

    let resolvedTruckId = truckId || null;
    if (tripId) {
      const trip = await Trip.findByPk(tripId);
      if (!trip) return res.status(400).json({ error: 'That trip does not exist.' });
      resolvedTruckId = trip.truckId;
    } else if (resolvedTruckId && !(await Truck.findByPk(resolvedTruckId))) {
      return res.status(400).json({ error: 'That truck does not exist.' });
    }

    const expense = await Expense.create({
      tripId: tripId || null, truckId: resolvedTruckId, category, amount,
      description: description || null, expenseDate,
    });
    res.status(201).json(await Expense.findByPk(expense.id, { include }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not record the expense.' });
  }
}

// PUT /api/expenses/:id. An expense tied to a trip keeps that trip's truck.
async function updateExpense(req, res) {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });

    const data = pick(req.body, ['category', 'amount', 'description', 'expenseDate']);
    if ('category' in data && !CATEGORIES.includes(data.category)) return res.status(400).json({ error: 'Choose a valid category.' });
    if ('amount' in data && (!data.amount || Number(data.amount) <= 0)) return res.status(400).json({ error: 'Enter an amount greater than zero.' });
    if ('expenseDate' in data && !data.expenseDate) return res.status(400).json({ error: 'A date is required.' });

    if (!expense.tripId && req.body.truckId !== undefined) {
      const truckId = req.body.truckId || null;
      if (truckId && !(await Truck.findByPk(truckId))) return res.status(400).json({ error: 'That truck does not exist.' });
      data.truckId = truckId;
    }

    await expense.update(data);
    res.json(await Expense.findByPk(expense.id, { include }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not update the expense.' });
  }
}

async function deleteExpense(req, res) {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });
    await expense.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete the expense.' });
  }
}

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
