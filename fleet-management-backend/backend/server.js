require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth.routes');
const truckRoutes = require('./routes/trucks.routes');
const driverRoutes = require('./routes/drivers.routes');

const app = express();

app.use(cors());
app.use(express.json());

// A simple route just to confirm the API is alive — hit this in a browser
// or with curl once the server is running.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fleet Management API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/drivers', driverRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // sync() creates any tables that don't exist yet, based on the models.
    // { alter: true } also adjusts existing tables to match model changes —
    // convenient while we're still actively shaping the schema. Once this
    // is running against real company data, we'll switch to proper
    // migrations instead of alter-syncing, so a model tweak can never
    // accidentally reshape a live table.
    await sequelize.sync({ alter: true });
    console.log('Models synced with the database.');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start the server:', error.message);
  }
}

startServer();
