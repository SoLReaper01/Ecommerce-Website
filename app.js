// Main Express server setup with routes for authentication, products, cart, and orders
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Import route modules
const authRoutes = require("./server/routes/authRoutes");
const adminRoutes = require("./server/routes/adminRoutes");
const productRoutes = require("./server/routes/productRoutes");
const cartRoutes = require("./server/routes/cartRoutes");
const orderRoutes = require("./server/routes/orderRoutes");
const pool = require("./server/db");

// Create Express app
const app = express();

// Middleware setup
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// Basic test route
app.get("/", (req, res) => {
  res.send("Team 4 ecommerce project is running");
});

// Route setup
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Test database connection
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connected successfully",
      time: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});