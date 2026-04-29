const pool = require("../db");

// Get all products with optional sorting
const getAllProducts = async (sortBy = "id", order = "ASC") => {
  // Whitelist valid column names and order directions to prevent SQL injection.
  // We can't use $1 placeholders for column names, so we sanitize manually.
  const validColumns = ["id", "name", "price", "stock", "category"];
  const validOrders = ["ASC", "DESC"];

  const safeColumn = validColumns.includes(sortBy) ? sortBy : "id";
  const safeOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : "ASC";

  const result = await pool.query(
    `SELECT * FROM products ORDER BY ${safeColumn} ${safeOrder}`
  );
  return result.rows;
};

// Get a single product by ID
const getProductById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM products WHERE id = $1",
    [id]
  );
  return result.rows[0]; // returns undefined if not found
};

// Search products by keyword across name and description (case-insensitive)
const searchProducts = async (keyword) => {
  const result = await pool.query(
    `SELECT * FROM products
     WHERE name ILIKE $1 OR description ILIKE $1
     ORDER BY id ASC`,
    [`%${keyword}%`] // % wildcards allow partial matching on either side
  );
  return result.rows;
};

// Filter products — all filters are optional and can be combined freely
const filterProducts = async ({ category, minPrice, maxPrice, inStock }) => {
  const conditions = [];
  const values = [];
  let i = 1; // tracks the $N parameter index

  if (category) {
    conditions.push(`category ILIKE $${i}`); // case-insensitive category match
    values.push(category);
    i++;
  }

  if (minPrice !== undefined) {
    conditions.push(`price >= $${i}`);
    values.push(minPrice);
    i++;
  }

  if (maxPrice !== undefined) {
    conditions.push(`price <= $${i}`);
    values.push(maxPrice);
    i++;
  }

  // inStock doesn't need a $N param — it's a fixed condition with no user value
  if (inStock === true || inStock === "true") {
    conditions.push(`stock > 0`);
  }

  // Only add WHERE clause if at least one filter was provided
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT * FROM products ${where} ORDER BY id ASC`,
    values
  );
  return result.rows;
};

module.exports = { getAllProducts, getProductById, searchProducts, filterProducts };
