const express = require('express');
const router = express.Router();
const { getAllDrivers, getDriverById, createDriver, updateDriver } = require('../controllers/drivers.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getAllDrivers);
router.get('/:id', requireAuth, getDriverById);
router.post('/', requireAuth, createDriver);
router.put('/:id', requireAuth, updateDriver);

module.exports = router;
