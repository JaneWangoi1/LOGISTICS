const { sequelize, Driver, TruckDriverAssignment, Truck, Trip, Customer } = require('../models');
const { pick } = require('../utils/input');

const FIELDS = ['phone', 'idNumber', 'licenseNumber', 'licenseClass', 'licenseExpiry', 'employmentStatus'];

function driverFields(body) {
  const data = pick(body, FIELDS);
  if (!data.employmentStatus) delete data.employmentStatus;
  return data;
}

function uniqueMessage(error) {
  const field = error.errors?.[0]?.path === 'id_number' ? 'ID number' : 'license number';
  return `A driver with that ${field} already exists.`;
}

async function getAllDrivers(req, res) {
  try {
    const drivers = await Driver.findAll({
      order: [['name', 'ASC']],
      include: [{ model: TruckDriverAssignment, where: { assignedTo: null }, required: false, include: [{ model: Truck }] }],
    });
    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load drivers.' });
  }
}

// GET /api/drivers/:id: full assignment history (newest first) and recent trips.
async function getDriverById(req, res) {
  try {
    const driver = await Driver.findByPk(req.params.id, {
      include: [{ model: TruckDriverAssignment, include: [{ model: Truck }] }],
    });
    if (!driver) return res.status(404).json({ error: 'Driver not found.' });

    const json = driver.toJSON();
    json.TruckDriverAssignments.sort((a, b) => b.assignedFrom.localeCompare(a.assignedFrom) || b.id - a.id);

    const trips = await Trip.findAll({
      where: { driverId: driver.id },
      include: [{ model: Customer }, { model: Truck, attributes: ['id', 'registrationNo'] }],
      order: [['departureDate', 'DESC'], ['id', 'DESC']],
      limit: 20,
    });
    json.trips = trips.map((t) => ({
      id: t.id, origin: t.origin, destination: t.destination, customer: t.Customer?.name || '',
      registrationNo: t.Truck?.registrationNo || '', departureDate: t.departureDate,
      agreedRevenue: t.agreedRevenue, status: t.status,
    }));

    res.json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load this driver.' });
  }
}

async function createDriver(req, res) {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required.' });
    const driver = await Driver.create({ name: String(name).trim(), ...driverFields(req.body) });
    res.status(201).json(driver);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ error: uniqueMessage(error) });
    console.error(error);
    res.status(500).json({ error: 'Could not create the driver.' });
  }
}

async function updateDriver(req, res) {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found.' });

    const data = driverFields(req.body);
    if (req.body.name !== undefined) {
      if (!String(req.body.name).trim()) return res.status(400).json({ error: 'Name is required.' });
      data.name = String(req.body.name).trim();
    }
    await driver.update(data);
    res.json(driver);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ error: uniqueMessage(error) });
    console.error(error);
    res.status(500).json({ error: 'Could not update the driver.' });
  }
}

// DELETE /api/drivers/:id: only for a driver who has never been on a trip.
// Anyone with history is retired by setting their status to Terminated.
async function deleteDriver(req, res) {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found.' });

    if ((await Trip.count({ where: { driverId: driver.id } })) > 0) {
      return res.status(409).json({
        error: `${driver.name} has trips on record, so they can't be deleted. Set their status to Terminated instead.`,
      });
    }
    await sequelize.transaction(async (transaction) => {
      await TruckDriverAssignment.destroy({ where: { driverId: driver.id }, transaction });
      await driver.destroy({ transaction });
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete the driver.' });
  }
}

module.exports = { getAllDrivers, getDriverById, createDriver, updateDriver, deleteDriver };
