const express = require('express');
const router = express.Router();
const { login, getCurrentUser } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/login', login);
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;
