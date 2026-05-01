// Load User's cart on page load
loadCart();

// Get all cart items
async function loadCart() {
  try {
    const res = await fetch("/api/cart", {
      credentials: "include"
    });

    const data = await res.json();

    const container = document.getElementById("cartContainer");
    const totalEl = document.getElementById("cartTotal");
    const cartSummary = document.getElementById("cartSummary");

    container.innerHTML = "";

    if (!res.ok) {
      if (res.status === 401) {
        container.innerHTML = `<p>Please log in to view your cart.</p>`;
      } else {
        container.innerHTML = `<p>${data.message || "Error loading cart"}</p>`;
      }

      if (cartSummary) cartSummary.style.display = "none";
      return;
    }

    if (cartSummary) cartSummary.style.display = "block";

    let total = 0;

    const template = document.getElementById("cartItemTemplate");

    data.forEach(item => {
      const clone = template.content.cloneNode(true);

      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      clone.querySelector(".cartName").textContent = item.name;
      clone.querySelector(".cartPrice").textContent = `$${item.price}`;

      const quantityInput = clone.querySelector(".cartQuantity");
      quantityInput.value = item.quantity;

      quantityInput.addEventListener("change", () => {
        updateQuantity(item.id, quantityInput.value);
      });

      clone.querySelector(".removeBtn").addEventListener("click", () => {
        removeItem(item.id);
      });

      container.appendChild(clone);
    });

    totalEl.textContent = `Total: $${total.toFixed(2)}`;

  } catch (err) {
    console.error("Cart load error:", err);
  }
}

// Update item quantity in cart
async function updateQuantity(id, quantity) {
  await fetch(`/api/cart/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ quantity })
  });

  loadCart();
}

// Remove item from cart
async function removeItem(id) {
  await fetch(`/api/cart/remove/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  loadCart();
}

// Proceed to checkout page
function checkout() {
  window.location.href = "checkout.html";
}

