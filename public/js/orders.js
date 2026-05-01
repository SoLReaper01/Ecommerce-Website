// Load user's orders on page load
loadOrders();

// Get all orders
async function loadOrders() {
  try {
    const res = await fetch("http://localhost:3000/api/orders", {
      method: "GET",
      credentials: "include"
    });

    const orders = await res.json();

    if (!res.ok) {
      alert(orders.message || orders.error || "Failed to load orders");
      return;
    }

    const container = document.getElementById("ordersContainer");
    
    container.innerHTML = "";

    if (orders.length === 0) {
      container.innerHTML = "<p>No orders yet.</p>";
      return;
    }

    const template = document.getElementById("orderTemplate");

    orders.forEach(order => {
      const clone = template.content.cloneNode(true);

      const itemsText = order.items
        ? order.items
            .map(item => `${item.name} x${item.quantity} - $${item.price}`)
            .join(", ")
        : "N/A";

      clone.querySelector(".orderId").textContent = `Order #${order.id}`;
      clone.querySelector(".orderItems").textContent = `Items: ${itemsText}`;
      clone.querySelector(".orderTotal").textContent = `Total: $${order.total}`;
      clone.querySelector(".orderStatus").textContent = `Status: ${order.status}`;

      container.appendChild(clone);
    });

  } catch (err) {
    console.error(err);
    alert("Error loading orders");
  }
}