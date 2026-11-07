const express = require('express');
const router = express.Router();
const { getAllDrivers, getDriverById, createDriver, updateDriver, deleteDriver } = require('../controllers/drivers.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getAllDrivers);
router.get('/:id', requireAuth, getDriverById);
router.post('/', requireAuth, createDriver);
router.put('/:id', requireAuth, updateDriver);
router.delete('/:id', requireAuth, deleteDriver);

module.exports = router;
