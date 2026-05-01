console.log("Admin page loaded");
loadProducts();
loadOrders();
initAdmin();

function initAdmin() {
  const form = document.getElementById("addProductForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const productData = {
        name: document.getElementById("name").value,
        price: parseFloat(document.getElementById("price").value),
        description: document.getElementById("description").value,
        category: document.getElementById("category").value,
        color: document.getElementById("color").value,
        stock: parseInt(document.getElementById("stock").value) || 0
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(productData)
        });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Error adding product");
        return;
      }

      alert("Product added successfully!");
      form.reset();
      window.location.reload();

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
}

// GET all products
async function loadProducts() {
  try {
    const res = await fetch("/api/admin/products", {
      credentials: "include"
    });

    const products = await res.json();
    renderProducts(products);

  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// Render all Products
function renderProducts(products) {
  const container = document.getElementById("adminProductList");
  const template = document.getElementById("productTemplate");

  container.innerHTML = "";

  products.forEach(p => {
    const clone = template.content.cloneNode(true);

    clone.querySelector(".name").textContent = p.name;
    clone.querySelector(".description").textContent =
      "Description: " + (p.description || "No description");
    clone.querySelector(".price").textContent = "Price: $" + p.price;
    clone.querySelector(".stock").textContent = "Stock: " + p.stock;
    clone.querySelector(".category").textContent =
      "Category: " + (p.category || "N/A");
    clone.querySelector(".color").textContent =
      "Color: " + (p.color || "N/A");

    clone.querySelector(".deleteBtn").addEventListener("click", () => {
      deleteProduct(p.id);
    });

    container.appendChild(clone);
  });
}

// Delete product
async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  try {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Error deleting");
      return;
    }

    alert("Deleted!");
    loadProducts();

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

async function loadOrders() {
  try {
    const res = await fetch("/api/admin/orders", {
      credentials: "include"
    });

    const orders = await res.json();

    if (!res.ok) {
      alert(orders.message || "Error loading orders");
      return;
    }

    renderOrders(orders);
  } catch (err) {
    console.error("Error loading orders:", err);
  }
}

function renderOrders(orders) {
  const container = document.getElementById("adminOrderList");
  const template = document.getElementById("orderTemplate");

  container.innerHTML = "";

  if (orders.length === 0) {
    container.innerHTML = "<p>No customer orders yet.</p>";
    return;
  }

  orders.forEach(order => {
    const clone = template.content.cloneNode(true);

    clone.querySelector(".orderId").textContent = "Order #" + order.id;
    clone.querySelector(".customer").textContent =
      "Customer: " + (order.customer_name || "N/A");
    clone.querySelector(".email").textContent =
      "Email: " + order.customer_email;
    clone.querySelector(".address").textContent =
      "Shipping Address: " + order.shipping_address;
    clone.querySelector(".total").textContent =
      "Total: $" + order.total;
    clone.querySelector(".status").textContent =
      "Status: " + order.status;

    const select = clone.querySelector(".statusSelect");
    select.value = order.status;

    const button = clone.querySelector(".updateStatusBtn");

    button.addEventListener("click", () => {
      updateOrderStatus(order.id, select.value);
    });

    container.appendChild(clone);
  });
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Error updating status");
      return;
    }

    alert("Status updated!");
    loadOrders(); // refresh list

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}