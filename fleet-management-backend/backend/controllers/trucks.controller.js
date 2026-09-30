const { Truck, TruckDocument, MaintenanceRecord, TruckDriverAssignment, Driver } = require('../models');

// POST /api/trucks/:id/assign-driver — body: { driverId } to assign, or
// { driverId: null } to just unassign whoever is currently on this truck.
//
// A driver can only really be behind the wheel of one truck at a time, and
// a truck can only really have one driver at a time, so assigning someone
// new here first closes out any conflicting "current" assignment on either
// side (assignedTo: null → today's date) before opening a fresh one. That
// closing-out is exactly what turns into visible history later, rather
// than assignments just being silently overwritten.
async function assignDriver(req, res) {
  try {
    const truck = await Truck.findByPk(req.params.id);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found.' });
    }

    const { driverId } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    // Close this truck's current assignment, if it has one.
    await TruckDriverAssignment.update(
      { assignedTo: today },
      { where: { truckId: truck.id, assignedTo: null } }
    );

    if (driverId) {
      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        return res.status(400).json({ error: 'That driver does not exist.' });
      }

      // Close that driver's current assignment too, if they were already
      // on a different truck — otherwise they'd end up "currently
      // assigned" to two trucks at once.
      await TruckDriverAssignment.update(
        { assignedTo: today },
        { where: { driverId, assignedTo: null } }
      );

      await TruckDriverAssignment.create({
        truckId: truck.id,
        driverId,
        assignedFrom: today,
        assignedTo: null,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not update the driver assignment.' });
  }
}

// GET /api/trucks — the list view. Deliberately lean (no nested includes)
// since this can be called often just to refresh a table of 6-10 rows.
async function getAllTrucks(req, res) {
  try {
    const trucks = await Truck.findAll({ order: [['registrationNo', 'ASC']] });
    res.json(trucks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load trucks.' });
  }
}

// GET /api/trucks/:id — the profile page. Pulls in everything the truck
// profile needs in one call: its documents, its maintenance history, and
// whoever is currently assigned to it (if anyone yet — Drivers is Phase 4,
// so this will just come back empty for now, and start working the moment
// an assignment exists, with no backend change needed).
async function getTruckById(req, res) {
  try {
    const truck = await Truck.findByPk(req.params.id, {
      include: [
        { model: TruckDocument },
        { model: MaintenanceRecord, order: [['serviceDate', 'DESC']] },
        {
          model: TruckDriverAssignment,
          where: { assignedTo: null },
          required: false, // don't exclude the truck just because it has no current assignment
          include: [{ model: Driver }],
        },
      ],
    });

    if (!truck) {
      return res.status(404).json({ error: 'Truck not found.' });
    }

    res.json(truck);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load this truck.' });
  }
}

// POST /api/trucks
async function createTruck(req, res) {
  try {
    const { registrationNo, make, model, year, mileage, status } = req.body;

    if (!registrationNo) {
      return res.status(400).json({ error: 'Registration number is required.' });
    }

    const truck = await Truck.create({ registrationNo, make, model, year, mileage, status });
    res.status(201).json(truck);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'A truck with that registration number already exists.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Could not create the truck.' });
  }
}

// PUT /api/trucks/:id — handles ordinary edits AND status changes
// (deactivating a truck is just setting status to INACTIVE), so there's
// no separate deactivate endpoint to keep in sync with this one.
async function updateTruck(req, res) {
  try {
    const truck = await Truck.findByPk(req.params.id);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found.' });
    }

    const { registrationNo, make, model, year, mileage, status } = req.body;
    await truck.update({ registrationNo, make, model, year, mileage, status });
    res.json(truck);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'A truck with that registration number already exists.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Could not update the truck.' });
  }
}

module.exports = { getAllTrucks, getTruckById, createTruck, updateTruck, assignDriver };
