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

    orders.forEach(order => {
      const div = document.createElement("div");
      div.className = "order";

      const itemsText = order.items
        ? order.items.map(item => item.name).join(", ")
        : "N/A";

      div.innerHTML = `
        <h3>Order #${order.id}</h3>
        <p>Items: ${itemsText}</p>
        <p>Total: $${order.total}</p>
        <p>Status: ${order.status}</p>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    alert("Error loading orders");
  }
}

loadOrders();