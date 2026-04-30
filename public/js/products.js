async function loadProducts() {
  try {
    const res = await fetch("http://localhost:3000/api/products");
    const data = await res.json();

    const grid = document.getElementById("productGrid");

    grid.innerHTML = ""; // clear anything

    data.products.forEach(product => {
      const div = document.createElement("div");
      div.classList.add("product");

      div.innerHTML = `
        <img src="${product.image_url || 'images/default.jpg'}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.description || ""}</p>
        <p class="price">$${product.price}</p>
        <button onclick="addToCart('${product.name}')">Add to Cart</button>
      `;

      grid.appendChild(div);
    });

  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// Run only on products page
if (window.location.pathname.includes("products.html")) {
  loadProducts();
}