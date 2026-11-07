const { sequelize, Trip, Customer, Truck, Driver, Payment, Expense } = require('../models');
const { pick } = require('../utils/input');
const { localDateStr } = require('../utils/status');

const withParties = [{ model: Customer }, { model: Truck }, { model: Driver }];
const EDITABLE = [
  'origin', 'destination', 'cargoDescription', 'cargoWeightTonnes',
  'departureDate', 'expectedReturnDate', 'actualReturnDate', 'agreedRevenue', 'notes',
];
const REQUIRED_WHEN_EDITED = ['origin', 'destination', 'departureDate', 'agreedRevenue'];

async function getAllTrips(req, res) {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const trips = await Trip.findAll({ where, include: withParties, order: [['departureDate', 'DESC'], ['id', 'DESC']] });
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load trips.' });
  }
}

async function getTripById(req, res) {
  try {
    const trip = await Trip.findByPk(req.params.id, { include: [...withParties, { model: Payment }] });
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load this trip.' });
  }
}

// POST /api/trips
//
// Two ways to use it:
//  1. Booking a live trip (the default). This is where three other modules meet,
//     so it checks real state: the truck must be free and the driver must not be
//     out on something else. On success the truck flips to ON_TRIP.
//  2. Logging a trip that already happened (status: "COMPLETED"). Those checks
//     don't apply to the past, a truck that's busy today still did last month's
//     job, so they're skipped and the truck's status is left alone.
async function createTrip(req, res) {
  try {
    const {
      customerId, truckId, driverId, origin, destination, cargoDescription, cargoWeightTonnes,
      departureDate, expectedReturnDate, actualReturnDate, agreedRevenue, notes, status,
    } = req.body;

    if (!customerId || !truckId || !driverId || !origin || !destination || !departureDate || !agreedRevenue) {
      return res.status(400).json({ error: 'Customer, truck, driver, route, departure date, and revenue are all required.' });
    }
    if (Number(agreedRevenue) <= 0) return res.status(400).json({ error: 'Revenue must be more than zero.' });

    const [customer, truck, driver] = await Promise.all([
      Customer.findByPk(customerId), Truck.findByPk(truckId), Driver.findByPk(driverId),
    ]);
    if (!customer) return res.status(400).json({ error: 'That customer does not exist.' });
    if (!truck) return res.status(400).json({ error: 'That truck does not exist.' });
    if (!driver) return res.status(400).json({ error: 'That driver does not exist.' });

    const alreadyFinished = status === 'COMPLETED';
    const details = {
      customerId, truckId, driverId, origin, destination,
      cargoDescription: cargoDescription || null,
      cargoWeightTonnes: cargoWeightTonnes || null,
      departureDate,
      expectedReturnDate: expectedReturnDate || null,
      agreedRevenue,
      notes: notes || null,
    };

    if (alreadyFinished) {
      const returned = actualReturnDate || departureDate;
      if (returned < departureDate) {
        return res.status(400).json({ error: "The return date can't be before the departure date." });
      }
      const trip = await Trip.create({ ...details, actualReturnDate: returned, status: 'COMPLETED' });
      return res.status(201).json(await Trip.findByPk(trip.id, { include: withParties }));
    }

    if (truck.status !== 'AVAILABLE') {
      return res.status(400).json({ error: `${truck.registrationNo} isn't available right now — it's marked ${truck.status}.` });
    }
    if (await Trip.findOne({ where: { driverId, status: 'ONGOING' } })) {
      return res.status(400).json({ error: 'This driver already has another ongoing trip.' });
    }

    const trip = await Trip.create({ ...details, status: 'ONGOING' });
    await truck.update({ status: 'ON_TRIP' });
    res.status(201).json(await Trip.findByPk(trip.id, { include: withParties }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not create the trip.' });
  }
}

// PUT /api/trips/:id: corrects a trip's details, and/or closes it out. Closing
// (COMPLETED or CANCELLED) frees the truck, since "the trip isn't happening
// any more" and "the truck is free" are the same fact.
async function updateTrip(req, res) {
  try {
    const trip = await Trip.findByPk(req.params.id, { include: [{ model: Truck }] });
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const updates = pick(req.body, EDITABLE);
    for (const key of REQUIRED_WHEN_EDITED) {
      if (key in updates && updates[key] === null) {
        return res.status(400).json({ error: 'Route, departure date and revenue cannot be left blank.' });
      }
    }
    if ('agreedRevenue' in updates && Number(updates.agreedRevenue) <= 0) {
      return res.status(400).json({ error: 'Revenue must be more than zero.' });
    }

    const { status } = req.body;
    const closing = Boolean(status) && status !== trip.status;
    if (closing) {
      if (trip.status !== 'ONGOING' || !['COMPLETED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ error: 'Only an ongoing trip can be marked completed or cancelled.' });
      }
      updates.status = status;
      if (status === 'COMPLETED' && !updates.actualReturnDate) {
        updates.actualReturnDate = trip.actualReturnDate || localDateStr();
      }
    }

    const departure = updates.departureDate ?? trip.departureDate;
    const returned = 'actualReturnDate' in updates ? updates.actualReturnDate : trip.actualReturnDate;
    if (returned && returned < departure) {
      return res.status(400).json({ error: "The return date can't be before the departure date." });
    }

    await trip.update(updates);
    if (closing && trip.Truck?.status === 'ON_TRIP') await trip.Truck.update({ status: 'AVAILABLE' });

    res.json(await Trip.findByPk(trip.id, { include: withParties }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not update the trip.' });
  }
}

// DELETE /api/trips/:id: removes the trip and its payments. Expenses recorded
// against it are kept (they still cost money) but become plain truck expenses.
async function deleteTrip(req, res) {
  try {
    const trip = await Trip.findByPk(req.params.id, { include: [{ model: Truck }] });
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    await sequelize.transaction(async (transaction) => {
      await Payment.destroy({ where: { tripId: trip.id }, transaction });
      await Expense.update({ tripId: null }, { where: { tripId: trip.id }, transaction });
      await trip.destroy({ transaction });
      if (trip.status === 'ONGOING' && trip.Truck?.status === 'ON_TRIP') {
        await trip.Truck.update({ status: 'AVAILABLE' }, { transaction });
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete the trip.' });
  }
}

// POST /api/trips/:id/payments
async function createPayment(req, res) {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const { amount, paymentStatus, paymentDate, invoiceReference } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Enter an amount greater than zero.' });

    await Payment.create({
      tripId: trip.id,
      amount,
      paymentStatus: paymentStatus || 'PENDING',
      paymentDate: paymentDate || null,
      invoiceReference: invoiceReference || null,
    });
    res.status(201).json(await Trip.findByPk(trip.id, { include: [...withParties, { model: Payment }] }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not record the payment.' });
  }
}

// DELETE /api/trips/:id/payments/:paymentId
async function deletePayment(req, res) {
  try {
    const payment = await Payment.findOne({ where: { id: req.params.paymentId, tripId: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    await payment.destroy();
    res.json(await Trip.findByPk(req.params.id, { include: [...withParties, { model: Payment }] }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete the payment.' });
  }
}

module.exports = { getAllTrips, getTripById, createTrip, updateTrip, deleteTrip, createPayment, deletePayment };
