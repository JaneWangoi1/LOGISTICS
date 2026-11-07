const express = require('express');
const router = express.Router();
const { getDashboard, getAlertCount } = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getDashboard);
router.get('/alerts', requireAuth, getAlertCount);

module.exports = router;
