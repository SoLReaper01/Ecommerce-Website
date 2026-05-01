const API = "/api/cart";
// Load cart on page load
loadCart();

async function loadCart() {
  try {
    const res = await fetch("http://localhost:3000/api/cart", {
      credentials: "include"
    });

    const data = await res.json();

    console.log("FULL RESPONSE:", data);

    const container = document.getElementById("cartContainer");
    const totalEl = document.getElementById("cartTotal");

    container.innerHTML = "";

    if (!res.ok) {
      if (res.status === 401) {
        container.innerHTML = `<p>Please log in to view your cart.</p>`;
      } else {
        container.innerHTML = `<p>${data.message || "Error loading cart"}</p>`;
      }
      return;
    }

    let total = 0;

    data.forEach(item => {
      const div = document.createElement("div");
      div.className = "cart-item";

      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      div.innerHTML = `
        <h3>${item.name}</h3>
        <p>$${item.price}</p>
        <p>
          Quantity: 
          <input type="number" value="${item.quantity}" min="1"
            onchange="updateQuantity(${item.id}, this.value)">
        </p>
        <button onclick="removeItem(${item.id})">Remove</button>
      `;

      container.appendChild(div);
    });

    totalEl.textContent = `Total: $${total.toFixed(2)}`;

  } catch (err) {
    console.error("Cart load error:", err);
  }
}

async function updateQuantity(id, quantity) {
  await fetch(`/api/cart/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ quantity })
  });

  loadCart();
}

async function removeItem(id) {
  await fetch(`/api/cart/remove/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  loadCart();
}

function checkout() {
  window.location.href = "checkout.html";
}

