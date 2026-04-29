const express = require("express");
const {
  getAllProducts,
  getProductById,
  searchProducts,
  filterProducts,
} = require("../models/productModel");

const router = express.Router();

// ─────────────────────────────────────────────────────────
// GET /api/products
// Returns all products.
//
// Optional query params:
//   sortBy = id | name | price | stock | category  (default: id)
//   order  = asc | desc                            (default: asc)
//
// Examples:
//   GET /api/products
//   GET /api/products?sortBy=price&order=desc
// ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const { sortBy, order } = req.query;

  try {
    const products = await getAllProducts(sortBy, order);
    res.json({
      count: products.length,
      products,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/products/search
// Keyword search across product name and description.
//
// Required query param:
//   q = search term
//
// Example:
//   GET /api/products/search?q=hoodie
// ─────────────────────────────────────────────────────────
router.get("/search", async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ message: 'Search query "q" is required' });
  }

  try {
    const products = await searchProducts(q.trim());
    res.json({
      query: q.trim(),
      count: products.length,
      products,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/products/filter
// Filter products by category, price range, and/or availability.
// All params are optional and can be mixed and matched.
//
// Query params:
//   category = string        (e.g. tops, bottoms, outerwear)
//   minPrice = number        (e.g. 10)
//   maxPrice = number        (e.g. 50)
//   inStock  = true | false  (only show products with stock > 0)
//
// Examples:
//   GET /api/products/filter?category=tops
//   GET /api/products/filter?minPrice=20&maxPrice=50
//   GET /api/products/filter?category=tops&maxPrice=30&inStock=true
// ─────────────────────────────────────────────────────────
router.get("/filter", async (req, res) => {
  const { category, minPrice, maxPrice, inStock } = req.query;

  // Validate price inputs are real numbers if provided
  if (minPrice !== undefined && isNaN(parseFloat(minPrice))) {
    return res.status(400).json({ message: "minPrice must be a valid number" });
  }
  if (maxPrice !== undefined && isNaN(parseFloat(maxPrice))) {
    return res.status(400).json({ message: "maxPrice must be a valid number" });
  }
  if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
    return res.status(400).json({ message: "minPrice cannot be greater than maxPrice" });
  }

  try {
    const products = await filterProducts({
      category,
      minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined,
      inStock,
    });

    res.json({
      filters: { category, minPrice, maxPrice, inStock },
      count: products.length,
      products,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/products/:id
// Returns a single product by its ID.
//
// Example:
//   GET /api/products/1
//
// NOTE: This route must come AFTER /search and /filter.
// Express matches routes top-to-bottom, so if /:id came first,
// a request to /search would try to find a product with id="search".
// ─────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // Reject anything that isn't a positive whole number
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ message: "Product ID must be a positive integer" });
  }

  try {
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({ message: `No product found with id ${id}` });
    }

    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
