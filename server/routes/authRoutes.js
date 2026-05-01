// Authentication routes for user registration, login, logout, and profile access
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Import user model functions
const { createUser, findUserByEmail } = require("../models/userModel");

// Import authentication middleware
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required"
      });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser(
      name,
      email,
      phone || null,
      hashedPassword,
      "customer"
    );

    res.status(201).json({
      message: "User created",
      user
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message || "Unknown server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax"
    });

    res.json({ message: "Logged in" });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message || "Unknown server error" });
  }
 
});

// Logout Route
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// Protected Route
router.get("/profile", authenticate, (req, res) => {
  res.json({ message: "Profile data", user: req.user });
});

module.exports = router;