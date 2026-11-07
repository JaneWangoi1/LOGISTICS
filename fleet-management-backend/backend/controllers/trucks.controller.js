const {
  sequelize, Truck, TruckDocument, MaintenanceRecord, TruckDriverAssignment, Driver, Trip, Customer, Expense,
} = require('../models');
const { expiryStatus, annotateMaintenance, localDateStr } = require('../utils/status');
const { pick } = require('../utils/input');

const FIELDS = ['make', 'model', 'year', 'capacityTonnes', 'mileage', 'status'];

// "kda  123a" -> "KDA 123A", so the same truck can't be entered twice in different cases.
const normalisePlate = (value) => String(value).trim().replace(/\s+/g, ' ').toUpperCase();

function truckFields(body) {
  const data = pick(body, FIELDS);
  if (!data.status) delete data.status;      // a blank status must never overwrite the real one
  if (data.mileage == null) delete data.mileage;
  return data;
}

async function getAllTrucks(req, res) {
  try {
    const trucks = await Truck.findAll({ order: [['registrationNo', 'ASC']] });
    res.json(trucks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load trucks.' });
  }
}

// GET /api/trucks/:id: everything the truck profile needs in one call.
// Documents and maintenance records come back with their statuses already
// worked out (see utils/status.js), so this page, the Compliance page and the
// Dashboard always agree.
async function getTruckById(req, res) {
  try {
    const truck = await Truck.findByPk(req.params.id, {
      include: [
        { model: TruckDocument },
        { model: MaintenanceRecord },
        { model: TruckDriverAssignment, where: { assignedTo: null }, required: false, include: [{ model: Driver }] },
      ],
    });
    if (!truck) return res.status(404).json({ error: 'Truck not found.' });

    const json = truck.toJSON();
    json.TruckDocuments = json.TruckDocuments
      .map((doc) => ({ ...doc, status: expiryStatus(doc.expiryDate) }))
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

    const newestFirst = [...json.MaintenanceRecords].sort(
      (a, b) => b.serviceDate.localeCompare(a.serviceDate) || b.id - a.id
    );
    json.MaintenanceRecords = annotateMaintenance(newestFirst, json.mileage ?? 0);

    const trips = await Trip.findAll({
      where: { truckId: truck.id },
      include: [{ model: Customer }],
      order: [['departureDate', 'DESC'], ['id', 'DESC']],
      limit: 10,
    });
    json.recentTrips = trips.map((t) => ({
      id: t.id, origin: t.origin, destination: t.destination, customer: t.Customer?.name || '',
      departureDate: t.departureDate, agreedRevenue: t.agreedRevenue, status: t.status,
    }));

    res.json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load this truck.' });
  }
}

async function createTruck(req, res) {
  try {
    const { registrationNo } = req.body;
    if (!registrationNo || !String(registrationNo).trim()) {
      return res.status(400).json({ error: 'Registration number is required.' });
    }
    const truck = await Truck.create({ registrationNo: normalisePlate(registrationNo), ...truckFields(req.body) });
    res.status(201).json(truck);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'A truck with that registration number already exists.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Could not create the truck.' });
  }
}

async function updateTruck(req, res) {
  try {
    const truck = await Truck.findByPk(req.params.id);
    if (!truck) return res.status(404).json({ error: 'Truck not found.' });

    const data = truckFields(req.body);
    if (req.body.registrationNo !== undefined) {
      if (!String(req.body.registrationNo).trim()) {
        return res.status(400).json({ error: 'Registration number is required.' });
      }
      data.registrationNo = normalisePlate(req.body.registrationNo);
    }
    await truck.update(data);
    res.json(truck);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'A truck with that registration number already exists.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Could not update the truck.' });
  }
}

// DELETE /api/trucks/:id: only for a truck with no trips or expenses on record
// (say, one added by mistake). Anything with history is retired by setting its
// status to INACTIVE instead, so past income and costs are never lost.
async function deleteTruck(req, res) {
  try {
    const truck = await Truck.findByPk(req.params.id);
    if (!truck) return res.status(404).json({ error: 'Truck not found.' });

    const [trips, expenses] = await Promise.all([
      Trip.count({ where: { truckId: truck.id } }),
      Expense.count({ where: { truckId: truck.id } }),
    ]);
    if (trips > 0 || expenses > 0) {
      return res.status(409).json({
        error: `${truck.registrationNo} has trips or expenses on record, so it can't be deleted. Set its status to Inactive instead.`,
      });
    }

    await sequelize.transaction(async (transaction) => {
      await TruckDocument.destroy({ where: { truckId: truck.id }, transaction });
      await MaintenanceRecord.destroy({ where: { truckId: truck.id }, transaction });
      await TruckDriverAssignment.destroy({ where: { truckId: truck.id }, transaction });
      await truck.destroy({ transaction });
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete the truck.' });
  }
}

async function assignDriver(req, res) {
  try {
    const truck = await Truck.findByPk(req.params.id);
    if (!truck) return res.status(404).json({ error: 'Truck not found.' });

    const { driverId } = req.body;
    const today = localDateStr();
    await TruckDriverAssignment.update({ assignedTo: today }, { where: { truckId: truck.id, assignedTo: null } });

    if (driverId) {
      const driver = await Driver.findByPk(driverId);
      if (!driver) return res.status(400).json({ error: 'That driver does not exist.' });
      await TruckDriverAssignment.update({ assignedTo: today }, { where: { driverId, assignedTo: null } });
      await TruckDriverAssignment.create({ truckId: truck.id, driverId, assignedFrom: today, assignedTo: null });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not update the driver assignment.' });
  }
}

module.exports = { getAllTrucks, getTruckById, createTruck, updateTruck, deleteTruck, assignDriver };
