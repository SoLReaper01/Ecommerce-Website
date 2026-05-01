const express = require("express");
const pool = require("../db");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Apply auth to all order routes
router.use(authenticate);

// Checkout
router.post("/checkout", async (req, res) => {
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

    if (cartItems.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cart is empty" });
    }

    let total = 0;
    for (let item of cartItems.rows) {
      total += item.price * item.quantity;
    }

    const order = await client.query(
      "INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id",
      [req.user.id, total]
    );

    const orderId = order.rows[0].id;

    for (let item of cartItems.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    await client.query(
      `DELETE FROM cart_items
       WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)`,
      [req.user.id]
    );

    await client.query("COMMIT");

    res.json({ message: "Order placed", orderId });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;