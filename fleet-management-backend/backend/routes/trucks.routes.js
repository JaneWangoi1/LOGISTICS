const express = require('express');
const router = express.Router();
const { getAllTrucks, getTruckById, createTruck, updateTruck, deleteTruck, assignDriver } = require('../controllers/trucks.controller');
const { createDocument } = require('../controllers/documents.controller');
const { createMaintenance } = require('../controllers/maintenance.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getAllTrucks);
router.get('/:id', requireAuth, getTruckById);
router.post('/', requireAuth, createTruck);
router.put('/:id', requireAuth, updateTruck);
router.delete('/:id', requireAuth, deleteTruck);
router.post('/:id/assign-driver', requireAuth, assignDriver);
router.post('/:id/documents', requireAuth, createDocument);
router.post('/:id/maintenance', requireAuth, createMaintenance);

module.exports = router;
