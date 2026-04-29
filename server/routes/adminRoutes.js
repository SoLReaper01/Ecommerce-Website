const express = require("express");
const pool = require("../db");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All admin routes require login + admin role
router.use(authenticate);
router.use(authorize(["admin"]));

// Optional: get all products for admin dashboard
router.get("/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product
router.post("/products", async (req, res) => {
  const {
    name,
    description,
    category,
    color,
    price,
    stock,
    image_url
  } = req.body;

  try {
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({
        message: "name, price, and stock are required"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO products (name, description, category, color, price, stock, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [name, description || null, category || null, color || null, price, stock, image_url || null]
    );

    res.status(201).json({
      message: "Product added successfully",
      product: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit product
router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    category,
    color,
    price,
    stock,
    image_url
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE products
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        color = COALESCE($4, color),
        price = COALESCE($5, price),
        stock = COALESCE($6, stock),
        image_url = COALESCE($7, image_url)
      WHERE id = $8
      RETURNING *
      `,
      [
        name ?? null,
        description ?? null,
        category ?? null,
        color ?? null,
        price ?? null,
        stock ?? null,
        image_url ?? null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product deleted successfully",
      product: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View all orders
router.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        o.id,
        o.user_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.total,
        o.shipping_address,
        o.status,
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      `
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status
router.put("/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
  ];

  try {
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        allowedStatuses
      });
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order status updated successfully",
      order: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;