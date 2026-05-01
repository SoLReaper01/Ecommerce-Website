async function placeOrder() {
  const name = document.querySelector("input[placeholder='Full name']").value;
  const address = document.querySelector("input[placeholder='Street address']").value;
  const city = document.querySelector("input[placeholder='City']").value;
  const state = document.querySelector("input[placeholder='State']").value;
  const zip = document.querySelector("input[placeholder='ZIP code']").value;

  if (!name || !address || !city || !state || !zip) {
    alert("Please fill out all fields");
    return;
  }

  const fullAddress = `${name}, ${address}, ${city}, ${state} ${zip}`;

  try {
    const res = await fetch("http://localhost:3000/api/orders/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ shipping_address: fullAddress })
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        alert("Please log in to checkout");
      } else {
        alert(data.message || "Checkout failed");
      }
      return;
    }

    alert("Order placed successfully!");
    window.location.href = "orders.html";

  } catch (err) {
    console.error(err);
    alert("Error placing order");
  }
}