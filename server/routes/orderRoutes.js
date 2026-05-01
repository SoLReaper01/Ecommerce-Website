// Order routes for checkout and order history
const express = require("express");
const pool = require("../db");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Apply auth to all order routes
router.use(authenticate);

// Checkout
router.post("/checkout", async (req, res) => {
  const { shipping_address } = req.body;

  if (!shipping_address) {
    return res.status(400).json({ message: "Shipping address required" });
}

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cartItems = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       JOIN products p ON ci.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    // If cart is empty, return error
    if (cartItems.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate total and create order
    let total = 0;
    for (let item of cartItems.rows) {
      total += item.price * item.quantity;
    }

    // Create order
    const order = await client.query(
      `INSERT INTO orders (user_id, total, shipping_address)
      VALUES ($1, $2, $3)
      RETURNING id`,
      [req.user.id, total, shipping_address]
    );

    const orderId = order.rows[0].id;

    for (let item of cartItems.rows) {
      const stockUpdate = await client.query(
        `UPDATE products
        SET stock = stock - $1
        WHERE id = $2 AND stock >= $1
        RETURNING stock`,
        [item.quantity, item.product_id]
      );

      if (stockUpdate.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Not enough stock for one or more items"
        });
      }

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // Clear cart
    await client.query(
      `DELETE FROM cart_items
       WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)`,
      [req.user.id]
    );

    // Commit transaction
    await client.query("COMMIT");

    res.json({ message: "Order placed", orderId });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get user's order history
router.get("/", async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT * FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const result = [];

    for (let order of orders.rows) {
      const items = await pool.query(
        `SELECT oi.*, p.name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );

      result.push({
        ...order,
        items: items.rows
      });
    }

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;