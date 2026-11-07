const express = require('express');
const router = express.Router();
const { getSummary, getByTruck } = require('../controllers/finances.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/summary', requireAuth, getSummary);
router.get('/by-truck', requireAuth, getByTruck);

module.exports = router;
