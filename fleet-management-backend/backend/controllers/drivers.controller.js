const { Driver, TruckDriverAssignment, Truck } = require('../models');

// An empty string from a form field ("" for a date/optional text field left
// blank) is not the same as the field being absent, but Sequelize/MySQL
// reject "" for a DATE column outright (a raw 500, not a clean message).
// Converting "" to null here means "left blank" is treated as genuinely
// blank everywhere, for every optional field, not just the one that broke.
function blankToNull(value) {
  return value === '' ? null : value;
}

// GET /api/drivers — list view, with whichever truck each driver is
// CURRENTLY on (if any) included, matching the "Assigned Truck" field
// from the original spec.
async function getAllDrivers(req, res) {
  try {
    const drivers = await Driver.findAll({
      order: [['name', 'ASC']],
      include: [
        {
          model: TruckDriverAssignment,
          where: { assignedTo: null },
          required: false,
          include: [{ model: Truck }],
        },
      ],
    });
    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load drivers.' });
  }
}

// GET /api/drivers/:id — the profile page. Pulls the FULL assignment
// history (not just the current one), each with its truck, ordered newest
// first — this is what "Driver History → Assigned Trucks: KDA 123A,
// KDB 456B" from the spec actually renders from.
async function getDriverById(req, res) {
  try {
    const driver = await Driver.findByPk(req.params.id, {
      include: [
        {
          model: TruckDriverAssignment,
          include: [{ model: Truck }],
          order: [['assignedFrom', 'DESC']],
        },
      ],
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found.' });
    }

    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load this driver.' });
  }
}

// POST /api/drivers
async function createDriver(req, res) {
  try {
    const { name, phone, idNumber, licenseNumber, licenseClass, licenseExpiry, employmentStatus } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const driver = await Driver.create({
      name,
      phone: blankToNull(phone),
      idNumber: blankToNull(idNumber),
      licenseNumber: blankToNull(licenseNumber),
      licenseClass: blankToNull(licenseClass),
      licenseExpiry: blankToNull(licenseExpiry),
      employmentStatus,
    });
    res.status(201).json(driver);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path === 'id_number' ? 'ID number' : 'license number';
      return res.status(400).json({ error: `A driver with that ${field} already exists.` });
    }
    console.error(error);
    res.status(500).json({ error: 'Could not create the driver.' });
  }
}

// PUT /api/drivers/:id
async function updateDriver(req, res) {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found.' });
    }

    const { name, phone, idNumber, licenseNumber, licenseClass, licenseExpiry, employmentStatus } = req.body;
    await driver.update({
      name,
      phone: blankToNull(phone),
      idNumber: blankToNull(idNumber),
      licenseNumber: blankToNull(licenseNumber),
      licenseClass: blankToNull(licenseClass),
      licenseExpiry: blankToNull(licenseExpiry),
      employmentStatus,
    });
    res.json(driver);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path === 'id_number' ? 'ID number' : 'license number';
      return res.status(400).json({ error: `A driver with that ${field} already exists.` });
    }
    console.error(error);
    res.status(500).json({ error: 'Could not update the driver.' });
  }
}

module.exports = { getAllDrivers, getDriverById, createDriver, updateDriver };
