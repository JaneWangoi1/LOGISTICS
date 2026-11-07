const express = require('express');
const router = express.Router();
const { getAllCustomers, createCustomer } = require('../controllers/customers.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getAllCustomers);
router.post('/', requireAuth, createCustomer);

module.exports = router;
