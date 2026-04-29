const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./server/routes/authRoutes");
const adminRoutes = require("./server/routes/adminRoutes");
const pool = require("./server/db");

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Team 4 ecommerce project is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});