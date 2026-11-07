const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenses.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getExpenses);
router.post('/', requireAuth, createExpense);
router.put('/:id', requireAuth, updateExpense);
router.delete('/:id', requireAuth, deleteExpense);

module.exports = router;
