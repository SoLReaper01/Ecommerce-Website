const pool = require('../db');

const createUser = async (name, email, phone, passwordHash, role = "customer") => {
  const result = await pool.query(
    `
    INSERT INTO users (name, email, phone, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, phone, role
    `,
    [name, email, phone, passwordHash, role]
  );

  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  return result.rows[0];
};

module.exports = { createUser, findUserByEmail };