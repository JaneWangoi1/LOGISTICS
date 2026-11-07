require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const migrate = require('./database/migrate');

const app = express();

// CORS_ORIGIN (comma-separated) locks the API to your real website once it's
// hosted; with no value set, any origin is allowed, which is fine for local work.
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) } : undefined));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fleet Management API is running' });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/trucks', require('./routes/trucks.routes'));
app.use('/api/drivers', require('./routes/drivers.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/trips', require('./routes/trips.routes'));
app.use('/api/income', require('./routes/income.routes'));
app.use('/api/expenses', require('./routes/expenses.routes'));
app.use('/api/documents', require('./routes/documents.routes'));
app.use('/api/maintenance', require('./routes/maintenance.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

// Anything under /api that matched no route above.
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Malformed JSON in a request body, and anything else that slipped through.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request was not valid JSON.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.sync();   // creates any missing tables, never alters existing ones
    await migrate(sequelize); // brings older databases up to date (adds newer columns)
    console.log('Database ready.');

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Unable to start the server:', error.message);
    process.exit(1);
  }
}

startServer();
