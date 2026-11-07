const { Customer } = require('../models');

async function getAllCustomers(req, res) {
  try {
    const customers = await Customer.findAll({ order: [['name', 'ASC']] });
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load customers.' });
  }
}

async function createCustomer(req, res) {
  try {
    const { name, contactPerson, phone, email } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required.' });
    const customer = await Customer.create({ name, contactPerson, phone, email });
    res.status(201).json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not create the customer.' });
  }
}

module.exports = { getAllCustomers, createCustomer };
