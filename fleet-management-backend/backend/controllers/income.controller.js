const { parseRange, incomeRows, total } = require('../utils/finance');

// GET /api/income?truckId=&from=&to=
// Every non-cancelled trip as an income entry, with what has been paid so far
// and what is still owed. The totals cover exactly the rows returned.
async function getIncome(req, res) {
  try {
    const parsed = parseRange(req.query);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const entries = await incomeRows({ range: parsed.range, truckId: req.query.truckId });
    res.json({
      entries,
      count: entries.length,
      total: total(entries, (e) => e.amount),
      received: total(entries, (e) => e.received),
      outstanding: total(entries, (e) => e.balance),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load income.' });
  }
}

module.exports = { getIncome };
