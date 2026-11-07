const {
  parseRange, periodTotals, profitByTruck, categoryBreakdown, monthlySeries, outstandingTotal, total,
} = require('../utils/finance');

// GET /api/reports?from=&to=. Everything the Reports page shows, for any
// period (no dates means all time).
async function getReport(req, res) {
  try {
    const parsed = parseRange(req.query);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const { range } = parsed;

    const totals = await periodTotals(range);
    const byTruck = await profitByTruck(range);

    res.json({
      range,
      totals: { income: totals.income, expenses: totals.expenses, profit: totals.profit, margin: totals.margin },
      // Costs that aren't tied to any truck (e.g. a tracking subscription), so the
      // truck table can add up to the fleet total.
      unassignedExpenses: totals.expenses - total(byTruck, (t) => t.expenses),
      outstandingPayments: await outstandingTotal(),
      byTruck,
      byCategory: categoryBreakdown(totals.expenseRows),
      byMonth: monthlySeries(range, totals.tripRows, totals.expenseRows),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not build the report.' });
  }
}

module.exports = { getReport };
