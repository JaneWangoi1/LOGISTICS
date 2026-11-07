const express = require('express');
const router = express.Router();
const { getReport } = require('../controllers/reports.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getReport);

module.exports = router;
