const { Op } = require('sequelize');
const { Truck, TruckDocument, MaintenanceRecord, Driver } = require('../models');
const { expiryStatus, daysUntil, annotateMaintenanceByTruck } = require('../utils/status');
const { parseRange, periodTotals, profitByTruck, unpaidTrips, categoryBreakdown } = require('../utils/finance');

// A retired (INACTIVE) truck shouldn't nag about expired papers or overdue servicing.
const isLive = (truck) => Boolean(truck) && truck.status !== 'INACTIVE';

// Everything that needs a human to act: expiring papers, overdue servicing and
// driving licences. Used by the Dashboard and by the Compliance badge in the sidebar.
async function computeCompliance() {
  const documents = await TruckDocument.findAll({
    include: [{ model: Truck, attributes: ['id', 'registrationNo', 'status'] }],
    order: [['expiryDate', 'ASC']],
  });
  const expiredDocuments = [];
  const expiringDocuments = [];
  for (const doc of documents) {
    if (!isLive(doc.Truck)) continue;
    const status = expiryStatus(doc.expiryDate);
    if (status === 'VALID') continue;
    (status === 'EXPIRED' ? expiredDocuments : expiringDocuments).push({
      id: doc.id, truckId: doc.truckId, registrationNo: doc.Truck.registrationNo,
      documentType: doc.documentType, expiryDate: doc.expiryDate, daysLeft: daysUntil(doc.expiryDate),
    });
  }

  const records = await MaintenanceRecord.findAll({
    include: [{ model: Truck, attributes: ['id', 'registrationNo', 'mileage', 'status'] }],
  });
  const serviceDue = annotateMaintenanceByTruck(records.map((r) => r.toJSON()))
    .filter((r) => r.due && isLive(r.Truck))
    .map((r) => ({ truckId: r.truckId, registrationNo: r.Truck.registrationNo, serviceType: r.serviceType.trim() }))
    .sort((a, b) => a.registrationNo.localeCompare(b.registrationNo) || a.serviceType.localeCompare(b.serviceType));

  const drivers = await Driver.findAll({
    where: { employmentStatus: { [Op.ne]: 'TERMINATED' }, licenseExpiry: { [Op.ne]: null } },
    order: [['licenseExpiry', 'ASC']],
  });
  const licences = drivers
    .map((driver) => ({ driver, status: expiryStatus(driver.licenseExpiry) }))
    .filter(({ status }) => status !== 'VALID')
    .map(({ driver, status }) => ({
      driverId: driver.id, name: driver.name, licenseExpiry: driver.licenseExpiry,
      status, daysLeft: daysUntil(driver.licenseExpiry),
    }));

  return { expiredDocuments, expiringDocuments, serviceDue, licences };
}

// GET /api/dashboard?from=&to=. One call that gathers everything the landing
// page shows. The dates only affect the money figures and highlights, since
// fleet status and alerts are about right now. No dates means all time.
async function getDashboard(req, res) {
  try {
    const parsed = parseRange(req.query);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const { range } = parsed;

    const trucks = await Truck.findAll({ attributes: ['id', 'status'] });
    const countStatus = (status) => trucks.filter((t) => t.status === status).length;
    const fleet = {
      total: trucks.length,
      available: countStatus('AVAILABLE'),
      onTrip: countStatus('ON_TRIP'),
      maintenance: countStatus('MAINTENANCE'),
      inactive: countStatus('INACTIVE'),
    };

    const [totals, unpaid, byTruck, compliance] = await Promise.all([
      periodTotals(range), unpaidTrips(), profitByTruck(range), computeCompliance(),
    ]);

    const topTruck = byTruck
      .filter((row) => row.income > 0 || row.expenses > 0)
      .sort((a, b) => b.profit - a.profit)[0] || null;
    const topExpenseCategory = categoryBreakdown(totals.expenseRows)[0] || null;

    res.json({
      range,
      fleet,
      finance: {
        income: totals.income,
        expenses: totals.expenses,
        profit: totals.profit,
        margin: totals.margin,
        outstandingPayments: unpaid.reduce((sum, t) => sum + t.outstanding, 0),
      },
      highlights: { topTruck, topExpenseCategory },
      attention: { ...compliance, unpaidTrips: unpaid },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load the dashboard.' });
  }
}

// GET /api/dashboard/alerts: the number shown on the Compliance badge.
async function getAlertCount(req, res) {
  try {
    const c = await computeCompliance();
    res.json({ count: c.expiredDocuments.length + c.expiringDocuments.length + c.serviceDue.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not count alerts.' });
  }
}

module.exports = { getDashboard, getAlertCount };
