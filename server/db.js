// Database connection using pg and environment variables
const { Pool } = require("pg");
require("dotenv").config();

// Create a new pool instance with database connection parameters
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

module.exports = pool;