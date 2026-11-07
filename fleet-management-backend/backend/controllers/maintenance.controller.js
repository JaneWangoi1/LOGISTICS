const { MaintenanceRecord, Truck } = require('../models');
const { annotateMaintenance, annotateMaintenanceByTruck } = require('../utils/status');

const newestFirst = (a, b) => b.serviceDate.localeCompare(a.serviceDate) || b.id - a.id;

// GET /api/maintenance: every record across the fleet, newest first. Each is
// flagged `due` (needs servicing now) or `superseded` (a later service of the
// same type has replaced it), judged against its own truck's odometer.
async function getAllMaintenance(req, res) {
  try {
    const records = await MaintenanceRecord.findAll({
      include: [{ model: Truck, attributes: ['id', 'registrationNo', 'mileage', 'status'] }],
    });
    const annotated = annotateMaintenanceByTruck(records.map((r) => r.toJSON()));
    res.json(annotated.sort(newestFirst));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load maintenance records.' });
  }
}

// POST /api/trucks/:id/maintenance
async function createMaintenance(req, res) {
  try {
    const truck = await Truck.findByPk(req.params.id);
    if (!truck) return res.status(404).json({ error: 'Truck not found.' });

    const { serviceType, cost, serviceDate, mileageAtService, nextServiceDueMileage, nextServiceDueDate, notes } = req.body;
    if (!serviceType || !serviceDate) {
      return res.status(400).json({ error: 'Service type and date are required.' });
    }

    const record = await MaintenanceRecord.create({
      truckId: truck.id,
      serviceType,
      cost: cost || null,
      serviceDate,
      mileageAtService: mileageAtService || null,
      nextServiceDueMileage: nextServiceDueMileage || null,
      nextServiceDueDate: nextServiceDueDate || null,
      notes: notes || null,
    });

    // Re-judge this truck's whole history, because the new record may
    // supersede an older one of the same type.
    const all = await MaintenanceRecord.findAll({ where: { truckId: truck.id } });
    const annotated = annotateMaintenance(all.map((r) => r.toJSON()), truck.mileage ?? 0);
    res.status(201).json(annotated.find((r) => r.id === record.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not add the maintenance record.' });
  }
}

// DELETE /api/maintenance/:id
async function deleteMaintenance(req, res) {
  try {
    const record = await MaintenanceRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Maintenance record not found.' });
    await record.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete the maintenance record.' });
  }
}

module.exports = { getAllMaintenance, createMaintenance, deleteMaintenance };
