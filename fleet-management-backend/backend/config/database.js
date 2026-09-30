const { Sequelize } = require('sequelize');
require('dotenv').config();

// Sequelize is an ORM (Object-Relational Mapper) — it lets us describe our
// tables as JavaScript objects ("models") and work with rows as JS objects,
// instead of writing raw SQL for every single operation. It still generates
// real SQL under the hood; we just don't have to type it out by hand.
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // flip to console.log to see every SQL query Sequelize runs — handy for debugging
    define: {
      underscored: true, // so a JS field like `registrationNo` becomes a `registration_no` column in MySQL
    },
  }
);

module.exports = sequelize;
