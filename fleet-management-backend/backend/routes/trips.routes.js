const express = require('express');
const router = express.Router();
const { getAllTrips, getTripById, createTrip, updateTrip, deleteTrip, createPayment, deletePayment } = require('../controllers/trips.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getAllTrips);
router.get('/:id', requireAuth, getTripById);
router.post('/', requireAuth, createTrip);
router.put('/:id', requireAuth, updateTrip);
router.delete('/:id', requireAuth, deleteTrip);
router.post('/:id/payments', requireAuth, createPayment);
router.delete('/:id/payments/:paymentId', requireAuth, deletePayment);

module.exports = router;
