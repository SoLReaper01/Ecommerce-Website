const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");

// Get user's cart
router.get("/", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       JOIN products p ON ci.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Add item to cart
router.post("/add", auth, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    // Get or create cart
    let cart = await db.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [req.user.id]
    );

    let cartId;

    if (cart.rows.length === 0) {
      const newCart = await db.query(
        "INSERT INTO carts (user_id) VALUES ($1) RETURNING id",
        [req.user.id]
      );
      cartId = newCart.rows[0].id;
    } else {
      cartId = cart.rows[0].id;
    }

    // Check if item already exists
    const existing = await db.query(
      "SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cartId, productId]
    );

    if (existing.rows.length > 0) {
      await db.query(
        "UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2",
        [quantity, existing.rows[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)",
        [cartId, productId, quantity]
      );
    }

    res.json({ message: "Item added to cart" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update quantity
router.put("/update/:id", auth, async (req, res) => {
  const { quantity } = req.body;

  try {
    await db.query(
      "UPDATE cart_items SET quantity = $1 WHERE id = $2",
      [quantity, req.params.id]
    );

    res.json({ message: "Quantity updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Remove item
router.delete("/remove/:id", auth, async (req, res) => {
  try {
    await db.query(
      "DELETE FROM cart_items WHERE id = $1",
      [req.params.id]
    );

    res.json({ message: "Item removed" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;