const express = require('express');
const router = express.Router();
const { getAllMaintenance, deleteMaintenance } = require('../controllers/maintenance.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getAllMaintenance);
router.delete('/:id', requireAuth, deleteMaintenance);

module.exports = router;
