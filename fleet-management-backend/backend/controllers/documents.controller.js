const { TruckDocument, Truck } = require('../models');
const { expiryStatus } = require('../utils/status');
const { pick } = require('../utils/input');

const TYPES = TruckDocument.rawAttributes.documentType.values;
const withTruck = [{ model: Truck, attributes: ['id', 'registrationNo', 'status'] }];
const present = (doc) => ({ ...doc.toJSON(), status: expiryStatus(doc.expiryDate) });

// GET /api/documents: every document across the fleet, soonest expiry first,
// each with its status (VALID, EXPIRING_SOON or EXPIRED).
async function getAllDocuments(req, res) {
  try {
    const documents = await TruckDocument.findAll({ include: withTruck, order: [['expiryDate', 'ASC']] });
    res.json(documents.map(present));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load documents.' });
  }
}

// POST /api/trucks/:id/documents
async function createDocument(req, res) {
  try {
    const truck = await Truck.findByPk(req.params.id);
    if (!truck) return res.status(404).json({ error: 'Truck not found.' });

    const { documentType, expiryDate } = req.body;
    if (!documentType || !expiryDate) {
      return res.status(400).json({ error: 'Document type and expiry date are required.' });
    }
    if (!TYPES.includes(documentType)) return res.status(400).json({ error: 'Choose a valid document type.' });

    const document = await TruckDocument.create({
      truckId: truck.id, documentType, expiryDate,
      documentNumber: req.body.documentNumber || null,
    });
    res.status(201).json(present(await TruckDocument.findByPk(document.id, { include: withTruck })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not add the document.' });
  }
}

// PUT /api/documents/:id
async function updateDocument(req, res) {
  try {
    const document = await TruckDocument.findByPk(req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found.' });

    const data = pick(req.body, ['documentType', 'documentNumber', 'expiryDate']);
    if ('documentType' in data && !TYPES.includes(data.documentType)) return res.status(400).json({ error: 'Choose a valid document type.' });
    if ('expiryDate' in data && !data.expiryDate) return res.status(400).json({ error: 'An expiry date is required.' });

    await document.update(data);
    res.json(present(await TruckDocument.findByPk(document.id, { include: withTruck })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not update the document.' });
  }
}

async function deleteDocument(req, res) {
  try {
    const document = await TruckDocument.findByPk(req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found.' });
    await document.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete the document.' });
  }
}

module.exports = { getAllDocuments, createDocument, updateDocument, deleteDocument };
