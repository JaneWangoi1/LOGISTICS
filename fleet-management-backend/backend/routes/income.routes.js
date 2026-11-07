const express = require('express');
const router = express.Router();
const { getIncome } = require('../controllers/income.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getIncome);

module.exports = router;
