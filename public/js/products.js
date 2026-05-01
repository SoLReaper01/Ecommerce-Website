// Load products on page load
loadProducts();

// Get all products
async function loadProducts() {
  try {
    const res = await fetch("http://localhost:3000/api/products");
    const data = await res.json();

    const grid = document.getElementById("productGrid");

    grid.innerHTML = "";

    const template = document.getElementById("productTemplate");

    data.products.forEach(product => {
      const clone = template.content.cloneNode(true);

      const img = clone.querySelector(".productImage");
      img.src = product.image_url || "images/default.jpg";
      img.alt = product.name;

      clone.querySelector(".productName").textContent = product.name;
      clone.querySelector(".productDescription").textContent = product.description || "";
      clone.querySelector(".productPrice").textContent = `$${product.price}`;

      clone.querySelector(".addToCartBtn").addEventListener("click", () => {
        addToCart(product.id);
      });

      grid.appendChild(clone);
    });

  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// Add product to cart
async function addToCart(productId) {
  try {
    const res = await fetch("http://localhost:3000/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        productId: productId,
        quantity: 1
      })
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        alert("Please log in to add to cart");
      } else {
        alert(data.message || "Failed to add to cart");
      }
      return;
    }

    alert("Added to cart!");

  } catch (err) {
    console.error("Add to cart error:", err);
    alert("Error adding to cart");
  }
}
