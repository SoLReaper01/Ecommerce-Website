// Script to create a default Admin account
const pool = require("./server/db");
const bcrypt = require("bcrypt");

// Creates a default Admin account
async function defaultAdmin() {
  const email = "admin@shop.com";
  const password = "admin123";

  const hashedPassword = await bcrypt.hash(password, 10);

  // Checks if the Admin account already exists
  const existing = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (existing.rows.length > 0) {
    console.log("Admin already exists");
    return;
  }

  // Creates the Admin account
  await pool.query(
    `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    `,
    ["Admin", email, hashedPassword, "admin"]
  );

  console.log("Admin created!");
}

defaultAdmin().then(() => process.exit());