const express = require('express');
const router = express.Router();
const { getAllTrucks, getTruckById, createTruck, updateTruck, assignDriver } = require('../controllers/trucks.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Every route here requires a valid admin session — requireAuth first,
// same pattern as auth.routes.js, and the one every future module follows.
router.get('/', requireAuth, getAllTrucks);
router.get('/:id', requireAuth, getTruckById);
router.post('/', requireAuth, createTruck);
router.put('/:id', requireAuth, updateTruck);
router.post('/:id/assign-driver', requireAuth, assignDriver);

module.exports = router;
