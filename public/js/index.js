// loads new arrivals on the homepage
loadNewArrivals();

// Script to load new arrivals on the homepage
async function loadNewArrivals() {
  const grid = document.getElementById("newArrivalsGrid");
  const template = document.getElementById("newArrivalTemplate");

  if (!grid || !template) return;

  try {
    const res = await fetch("/api/products");
    const data = await res.json();

    grid.innerHTML = "";

    const newestProducts = data.products
      .sort((a, b) => b.id - a.id)
      .slice(0, 3);

    newestProducts.forEach(product => {
      const clone = template.content.cloneNode(true);

      clone.querySelector(".productName").textContent = product.name;
      clone.querySelector(".productDescription").textContent = product.description || "";
      clone.querySelector(".productPrice").textContent = `$${product.price}`;

      grid.appendChild(clone);
    });

  } catch (err) {
    console.error("Error loading new arrivals:", err);
  }
}
