/* Team 4 Apparel — front-end prototype (vanilla HTML/CSS/JS)
   - Product catalog browse/search/filter
   - Product detail pages
   - Cart with quantity updates + totals
   - Checkout flow (shipping -> payment -> confirmation)
   - Accounts (register/login) + order history
   - Role-based admin tools (employee / management / admin)
*/

(() => {
  "use strict";

  const KEYS = {
    SEED: "t4_seed_v1",
    THEME: "t4_theme",
    PRODUCTS: "t4_products_v1",
    USERS: "t4_users_v1",
    ORDERS: "t4_orders_v1",
    MESSAGES: "t4_messages_v1",
    CART: "t4_cart_v1",
    SESSION: "t4_session_v1",
    AUDIT: "t4_audit_v1",
  };

  const ROLES = ["customer", "employee", "management", "admin"];

  // Session expiration after inactivity (minutes)
  const IDLE_MINUTES = 30;

  // Demo tax/shipping logic (placeholder)
  const TAX_RATE = 0.0725;
  const SHIPPING_FLAT = 5.99;
  const FREE_SHIPPING_OVER = 75;

  // ---------- Utilities ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const nowISO = () => new Date().toISOString();
  const money = (n) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

  function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function clamp(n, min, max) {
    n = Number(n);
    if (Number.isNaN(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function setText(sel, value) {
    const el = $(sel);
    if (el) el.textContent = value;
  }

  function setHTML(sel, html) {
    const el = $(sel);
    if (el) el.innerHTML = html;
  }

  function toast(msg, kind = "ok") {
    const app = $("#app");
    if (!app) return;
    const id = uid("toast");
    const el = document.createElement("div");
    el.className = `notice ${kind}`;
    el.id = id;
    el.role = "status";
    el.ariaLive = "polite";
    el.style.position = "fixed";
    el.style.right = "16px";
    el.style.bottom = "16px";
    el.style.maxWidth = "420px";
    el.style.zIndex = "9999";
    el.style.cursor = "pointer";
    el.textContent = msg;
    document.body.appendChild(el);
    const t = setTimeout(() => el.remove(), 3600);
    el.addEventListener("click", () => { clearTimeout(t); el.remove(); });
  }

  async function sha256Hex(input) {
    const enc = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function roleRank(role) {
    const i = ROLES.indexOf(role);
    return i === -1 ? 0 : i;
  }

  // ---------- Demo data ----------
  function demoProducts() {
    const base = [
      { name: "Everyday Crew Tee", category: "Men", price: 22.00, inventory: 34, tags: ["Best Seller"], featured: true },
      { name: "Relaxed Denim Jacket", category: "Men", price: 69.00, inventory: 12, tags: ["Outerwear"] },
      { name: "Cozy Knit Hoodie", category: "Men", price: 54.00, inventory: 18, tags: ["Soft"] },

      { name: "Flowy Summer Dress", category: "Women", price: 48.00, inventory: 26, tags: ["New"], featured: true },
      { name: "High‑Rise Straight Jeans", category: "Women", price: 62.00, inventory: 14, tags: ["Denim"] },
      { name: "Classic Trench Coat", category: "Women", price: 98.00, inventory: 6, tags: ["Outerwear"] },

      { name: "Everyday Sneakers", category: "Shoes", price: 58.00, inventory: 22, tags: ["Comfort"] },
      { name: "Leather Chelsea Boots", category: "Shoes", price: 120.00, inventory: 7, tags: ["Premium"], featured: true },

      { name: "Canvas Tote Bag", category: "Accessories", price: 18.00, inventory: 40, tags: ["Reusable"] },
      { name: "Minimalist Cap", category: "Accessories", price: 16.00, inventory: 28, tags: ["Street"] },
      { name: "Wool Beanie", category: "Accessories", price: 20.00, inventory: 19, tags: ["Warm"] },

      { name: "Final‑Sale Mystery Pack", category: "Sale", price: 25.00, inventory: 10, tags: ["Sale"] },
    ];

    const descriptions = {
      Men: "Clean lines, breathable fabric, and reliable fit. Built for daily wear.",
      Women: "Easy silhouettes, soft hand-feel, and effortless style for any day.",
      Shoes: "Cushioned comfort with durable construction—ready for miles.",
      Accessories: "Small upgrades that pull an outfit together, without trying too hard.",
      Sale: "Limited-run and clearance items. When it's gone, it's gone.",
    };

    const sizes = ["XS", "S", "M", "L", "XL"];
    const shoeSizes = ["7", "8", "9", "10", "11", "12"];
    const colors = ["Black", "White", "Navy", "Sand", "Olive"];

    return base.map((p, idx) => {
      const id = String(1000 + idx);
      const isShoe = p.category === "Shoes";
      const long = `${descriptions[p.category] || "Quality apparel designed for comfort."}
\n\nDetails:
• Materials: Cotton blend / performance fibers (varies by item)
• Care: Machine wash cold, tumble dry low
• Fit: True to size (see size chart in checkout notes)`;

      return {
        id,
        sku: `T4-${p.category.slice(0, 2).toUpperCase()}-${1000 + idx}`,
        name: p.name,
        category: p.category,
        price: Number(p.price),
        inventory: Number(p.inventory),
        description: descriptions[p.category] || "Quality apparel designed for comfort.",
        details: long,
        sizes: isShoe ? shoeSizes : sizes,
        colors: colors,
        tags: p.tags || [],
        featured: Boolean(p.featured),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        active: true,
      };
    });
  }

  function productImageDataUrl(product) {
    // Deterministic-ish palette by category
    const palette = {
      Men: ["#6ea8ff", "#8be9fd"],
      Women: ["#ff7ab6", "#ffd36a"],
      Shoes: ["#a78bfa", "#60a5fa"],
      Accessories: ["#34d399", "#22c55e"],
      Sale: ["#fb7185", "#fbbf24"],
    };
    const [a, b] = palette[product.category] || ["#6ea8ff", "#8be9fd"];
    const text = product.name.replace(/[^\w ]/g, "").slice(0, 18);
    const initials = product.name.split(/\s+/).map(s => s[0]).slice(0, 2).join("").toUpperCase();

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${a}"/>
            <stop offset="1" stop-color="${b}"/>
          </linearGradient>
          <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="rgba(0,0,0,.35)"/>
          </filter>
        </defs>
        <rect width="800" height="500" rx="36" fill="url(#g)"/>
        <circle cx="640" cy="130" r="90" fill="rgba(255,255,255,.18)"/>
        <circle cx="140" cy="390" r="110" fill="rgba(255,255,255,.12)"/>
        <g filter="url(#s)">
          <rect x="60" y="70" width="680" height="360" rx="30" fill="rgba(10,16,33,.22)" stroke="rgba(255,255,255,.22)"/>
          <text x="110" y="210" font-family="ui-sans-serif, system-ui" font-size="86" font-weight="800" fill="rgba(255,255,255,.95)">${escapeHtml(initials)}</text>
          <text x="110" y="270" font-family="ui-sans-serif, system-ui" font-size="34" font-weight="700" fill="rgba(255,255,255,.92)">${escapeHtml(product.category)}</text>
          <text x="110" y="330" font-family="ui-sans-serif, system-ui" font-size="24" fill="rgba(255,255,255,.88)">${escapeHtml(text)}</text>
          <text x="110" y="380" font-family="ui-sans-serif, system-ui" font-size="20" fill="rgba(255,255,255,.75)">${escapeHtml(product.sku)}</text>
        </g>
      </svg>
    `.trim();

    return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
  }

  // ---------- State ----------
  const state = {
    products: [],
    users: [],
    orders: [],
    messages: [],
    audit: [],
    cart: [],
    session: null,
    catalog: {
      q: "",
      category: "All",
      sort: "featured",
    },
    checkout: {
      step: 1,
      shipping: null,
      payment: null,
    }
  };

  // ---------- Persistence ----------
  function loadAll() {
    state.products = readJSON(KEYS.PRODUCTS, []);
    state.users = readJSON(KEYS.USERS, []);
    state.orders = readJSON(KEYS.ORDERS, []);
    state.messages = readJSON(KEYS.MESSAGES, []);
    state.cart = readJSON(KEYS.CART, []);
    state.session = readJSON(KEYS.SESSION, null);
    state.audit = readJSON(KEYS.AUDIT, []);
  }

  function saveProducts() { writeJSON(KEYS.PRODUCTS, state.products); }
  function saveUsers() { writeJSON(KEYS.USERS, state.users); }
  function saveOrders() { writeJSON(KEYS.ORDERS, state.orders); }
  function saveMessages() { writeJSON(KEYS.MESSAGES, state.messages); }
  function saveCart() { writeJSON(KEYS.CART, state.cart); }
  function saveSession() { writeJSON(KEYS.SESSION, state.session); }
  function saveAudit() { writeJSON(KEYS.AUDIT, state.audit); }

  function audit(action, detail = {}) {
    const entry = {
      id: uid("audit"),
      at: nowISO(),
      by: state.session?.email || "anonymous",
      role: state.session?.role || "guest",
      action,
      detail,
    };
    state.audit.unshift(entry);
    state.audit = state.audit.slice(0, 200);
    saveAudit();
  }

  async function seedIfNeeded() {
    const seeded = localStorage.getItem(KEYS.SEED);
    if (seeded) return;

    const products = demoProducts();

    const defaults = [
      { email: "admin@team4.local", name: "Admin", role: "admin", password: "Admin123!" },
      { email: "manager@team4.local", name: "Store Manager", role: "management", password: "Manager123!" },
      { email: "employee@team4.local", name: "Employee", role: "employee", password: "Employee123!" },
      { email: "customer@team4.local", name: "Customer", role: "customer", password: "Customer123!" },
    ];

    const users = [];
    for (const u of defaults) {
      users.push({
        id: uid("user"),
        email: normalizeEmail(u.email),
        name: u.name,
        role: u.role,
        passHash: await sha256Hex(u.password),
        createdAt: nowISO(),
        disabled: false,
      });
    }

    writeJSON(KEYS.PRODUCTS, products);
    writeJSON(KEYS.USERS, users);
    writeJSON(KEYS.ORDERS, []);
    writeJSON(KEYS.MESSAGES, []);
    writeJSON(KEYS.CART, []);
    writeJSON(KEYS.AUDIT, []);
    localStorage.setItem(KEYS.SEED, "1");
  }

  // ---------- Auth + access control ----------
  function getUserByEmail(email) {
    const e = normalizeEmail(email);
    return state.users.find(u => u.email === e);
  }

  function isAuthed() {
    return Boolean(state.session?.email);
  }

  function hasRoleAtLeast(role) {
    const current = state.session?.role || "customer";
    return roleRank(current) >= roleRank(role);
  }

  function requireAuth(nextHash) {
    if (isAuthed()) return true;
    const dest = encodeURIComponent(nextHash || location.hash || "#/products");
    location.hash = `#/login?next=${dest}`;
    return false;
  }

  function requireRoleAtLeast(minRole, nextHash) {
    if (!requireAuth(nextHash)) return false;
    if (!hasRoleAtLeast(minRole)) {
      location.hash = "#/denied";
      return false;
    }
    return true;
  }

  async function register({ name, email, password }) {
    const e = normalizeEmail(email);
    if (!e || !password || password.length < 8) throw new Error("Please provide a valid email and a password (8+ chars).");
    if (getUserByEmail(e)) throw new Error("An account with that email already exists.");

    const user = {
      id: uid("user"),
      email: e,
      name: (name || "Customer").trim() || "Customer",
      role: "customer",
      passHash: await sha256Hex(password),
      createdAt: nowISO(),
      disabled: false,
    };
    state.users.unshift(user);
    saveUsers();
    audit("user.register", { email: e });
    return user;
  }

  async function login({ email, password }) {
    const e = normalizeEmail(email);
    const user = getUserByEmail(e);
    if (!user || user.disabled) throw new Error("Invalid email or password.");
    const hash = await sha256Hex(password || "");
    if (hash !== user.passHash) throw new Error("Invalid email or password.");

    state.session = {
      email: user.email,
      role: user.role,
      name: user.name,
      issuedAt: nowISO(),
      lastActiveAt: Date.now(),
    };
    saveSession();
    audit("user.login", { email: user.email, role: user.role });

    return user;
  }

  function logout() {
    const who = state.session?.email;
    state.session = null;
    saveSession();
    audit("user.logout", { email: who || "unknown" });
    toast("Logged out.", "ok");
    location.hash = "#/products";
  }

  function touchSession() {
    if (!state.session) return;
    state.session.lastActiveAt = Date.now();
    saveSession();
  }

  function checkIdleLogout() {
    if (!state.session?.lastActiveAt) return;
    const ms = Date.now() - state.session.lastActiveAt;
    const max = IDLE_MINUTES * 60 * 1000;
    if (ms > max) {
      state.session = null;
      saveSession();
      toast(`Session expired after ${IDLE_MINUTES} minutes of inactivity. Please log in again.`, "warn");
      location.hash = "#/login";
    }
  }

  // ---------- Cart ----------
  function cartCount() {
    return state.cart.reduce((sum, it) => sum + Number(it.qty || 0), 0);
  }

  function setCartCount() {
    setText("#cartCount", String(cartCount()));
  }

  function productById(id) {
    return state.products.find(p => p.id === String(id));
  }

  function cartTotals() {
    let subtotal = 0;
    for (const it of state.cart) {
      const p = productById(it.productId);
      if (!p) continue;
      subtotal += p.price * it.qty;
    }
    const tax = subtotal * TAX_RATE;
    const shipping = subtotal === 0 ? 0 : (subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT);
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  }

  function addToCart(productId, { qty = 1, size, color } = {}) {
    const p = productById(productId);
    if (!p || !p.active) return;
    qty = clamp(qty, 1, 99);
    if (p.inventory <= 0) {
      toast("This item is currently out of stock.", "warn");
      return;
    }
    if (!size) size = p.sizes?.[0];
    if (!color) color = p.colors?.[0];

    const existing = state.cart.find(it => it.productId === p.id && it.size === size && it.color === color);
    const currentQty = existing ? existing.qty : 0;
    const maxAdd = Math.max(0, p.inventory - currentQty);
    if (maxAdd <= 0) {
      toast("You already have the maximum available quantity in your cart.", "warn");
      return;
    }
    const addQty = Math.min(qty, maxAdd);

    if (existing) existing.qty += addQty;
    else state.cart.push({ id: uid("cart"), productId: p.id, qty: addQty, size, color });

    saveCart();
    audit("cart.add", { productId: p.id, qty: addQty, size, color });
    setCartCount();
    toast(`Added ${addQty} × ${p.name} to cart.`, "ok");
  }

  function updateCartItem(itemId, newQty) {
    const it = state.cart.find(x => x.id === itemId);
    if (!it) return;
    const p = productById(it.productId);
    if (!p) return;

    newQty = clamp(newQty, 0, 99);

    // Respect inventory
    if (newQty > p.inventory) newQty = p.inventory;

    if (newQty <= 0) {
      removeCartItem(itemId);
      return;
    }

    it.qty = newQty;
    saveCart();
    audit("cart.updateQty", { itemId, productId: it.productId, qty: newQty });
  }

  function removeCartItem(itemId) {
    const idx = state.cart.findIndex(x => x.id === itemId);
    if (idx === -1) return;
    const removed = state.cart.splice(idx, 1)[0];
    saveCart();
    audit("cart.remove", { itemId, productId: removed.productId });
  }

  function clearCart() {
    state.cart = [];
    saveCart();
    audit("cart.clear");
    setCartCount();
  }

  // ---------- Rendering helpers ----------
  function setActiveNav() {
    const path = getPath().split("?")[0];
    $$(".nav-link").forEach(a => {
      const href = a.getAttribute("href") || "";
      a.classList.toggle("active", href === `#${path}`);
    });
  }

  function updateHeaderAuth() {
    const authLink = $("#authLink");
    const regLink = $("#registerLink");
    const mobileAuthLink = $("#mobileAuthLink");
    const mobileRegLink = $("#mobileRegisterLink");
    const mobileLogoutBtn = $("#mobileLogoutBtn");
    const mobileAccountLink = $("#mobileAccountLink");
    const mobileAdminLink = $("#mobileAdminLink");

    const isIn = isAuthed();
    if (authLink) authLink.textContent = isIn ? `Hi, ${state.session?.name?.split(" ")[0] || "Account"}` : "Login";
    if (authLink) authLink.setAttribute("href", isIn ? "#/account" : "#/login");
    if (regLink) regLink.hidden = isIn;

    if (mobileAuthLink) mobileAuthLink.textContent = isIn ? `Account (${state.session?.role})` : "Login";
    if (mobileAuthLink) mobileAuthLink.setAttribute("href", isIn ? "#/account" : "#/login");
    if (mobileRegLink) mobileRegLink.hidden = isIn;

    if (mobileLogoutBtn) mobileLogoutBtn.hidden = !isIn;
    if (mobileAccountLink) mobileAccountLink.hidden = !isIn;

    const canSeeAdmin = isIn && hasRoleAtLeast("employee");
    if (mobileAdminLink) mobileAdminLink.hidden = !canSeeAdmin;
  }

  function pageShell({ title, subtitle, actionsHTML = "" }) {
    return `
      <section class="card pad">
        <div class="flex between" style="gap: 12px; flex-wrap: wrap;">
          <div>
            <h2 style="margin: 0 0 6px">${escapeHtml(title)}</h2>
            ${subtitle ? `<p class="muted" style="margin: 0">${escapeHtml(subtitle)}</p>` : ""}
          </div>
          ${actionsHTML ? `<div class="flex" style="flex-wrap: wrap; justify-content: flex-end">${actionsHTML}</div>` : ""}
        </div>
        <div class="divider"></div>
        <div id="pageBody"></div>
      </section>
    `;
  }

  function renderNotice(title, body, kind = "warn", actionsHTML = "") {
    setHTML("#app", `
      <section class="card pad">
        <div class="notice ${kind}">
          <strong>${escapeHtml(title)}</strong>
          <div class="small" style="margin-top: 6px; color: var(--muted)">${body}</div>
        </div>
        ${actionsHTML ? `<div style="margin-top: 14px" class="flex">${actionsHTML}</div>` : ""}
      </section>
    `);
  }

  // ---------- Pages ----------
  function renderProducts() {
    const featured = state.products.filter(p => p.active && p.featured).slice(0, 4);

    setHTML("#app", `
      <section class="card hero">
        <div>
          <div class="chip-row" style="margin-bottom: 12px">
            <span class="badge">Browse • Search • Filter</span>
            <span class="badge">Responsive UI</span>
            <span class="badge">Cart + Checkout</span>
            ${hasRoleAtLeast("employee") ? `<a class="badge" href="#/admin">Admin tools</a>` : ""}
          </div>
          <h1>Shop clothes online — fast, simple, and secure (demo).</h1>
          <p>
            Browse the catalog, view product details, add items to your cart, and check out in a smooth step‑by‑step flow.
          </p>
          <div class="divider"></div>
          <div class="flex" style="flex-wrap: wrap">
            <a class="btn btn-primary" href="#/products?focus=catalog">Start shopping</a>
            <a class="btn btn-ghost" href="#/security">Security &amp; reliability</a>
            <span class="badge">Tip: press <span class="kbd">/</span> to search</span>
          </div>
        </div>

        <div class="hero-right">
          <strong>Featured picks</strong>
          <div class="divider"></div>
          <div class="grid cols-2" style="gap: 10px">
            ${featured.map(p => `
              <a class="card product-card" href="#/product/${p.id}" style="text-decoration:none">
                <div class="product-media">
                  <img alt="${escapeHtml(p.name)}" src="${productImageDataUrl(p)}" loading="lazy"/>
                </div>
                <div class="product-body" style="padding: 10px">
                  <div class="small muted">${escapeHtml(p.category)}</div>
                  <div class="product-title" style="font-size:14px; margin:0">${escapeHtml(p.name)}</div>
                  <div class="price">${money(p.price)}</div>
                </div>
              </a>
            `).join("")}
          </div>
        </div>
      </section>

      <div id="catalog"></div>
    `);

    // Catalog controls + grid
    const categories = ["All", ...Array.from(new Set(state.products.map(p => p.category)))];

    const bodyHTML = `
      <section class="card pad" style="margin-top: 16px">
        <div class="flex between" style="gap: 12px; flex-wrap: wrap;">
          <div>
            <h2 style="margin: 0 0 6px">Product catalog</h2>
            <p class="muted" style="margin: 0">Browse, search, and filter apparel items.</p>
          </div>
          <div class="flex" style="flex-wrap: wrap">
            <div style="min-width: 260px;">
              <label class="label" for="searchInput">Search</label>
              <input id="searchInput" class="input" placeholder="Try: hoodie, dress, boots…" autocomplete="off" />
            </div>
            <div style="min-width: 200px;">
              <label class="label" for="sortSelect">Sort</label>
              <select id="sortSelect">
                <option value="featured">Featured</option>
                <option value="priceAsc">Price: low → high</option>
                <option value="priceDesc">Price: high → low</option>
                <option value="nameAsc">Name: A → Z</option>
              </select>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="chip-row" id="categoryChips">
          ${categories.map(c => `
            <button type="button" class="chip ${c === state.catalog.category ? "active" : ""}" data-cat="${escapeHtml(c)}">
              ${escapeHtml(c)}
            </button>
          `).join("")}
        </div>

        <div class="controls">
          <div class="muted small" id="resultsMeta"></div>
          <div class="muted small">Free shipping over ${money(FREE_SHIPPING_OVER)} (demo)</div>
        </div>

        <div class="grid cols-4" id="productGrid"></div>
      </section>
    `;
    $("#catalog").innerHTML = bodyHTML;

    const searchInput = $("#searchInput");
    const sortSelect = $("#sortSelect");
    if (searchInput) searchInput.value = state.catalog.q || "";
    if (sortSelect) sortSelect.value = state.catalog.sort || "featured";

    function applyAndRender() {
      const q = (state.catalog.q || "").trim().toLowerCase();
      const cat = state.catalog.category || "All";

      let items = state.products.filter(p => p.active);

      if (cat !== "All") items = items.filter(p => p.category === cat);
      if (q) items = items.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tags || []).join(" ").toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );

      const sort = state.catalog.sort || "featured";
      items = items.slice();
      if (sort === "priceAsc") items.sort((a,b) => a.price - b.price);
      if (sort === "priceDesc") items.sort((a,b) => b.price - a.price);
      if (sort === "nameAsc") items.sort((a,b) => a.name.localeCompare(b.name));
      if (sort === "featured") items.sort((a,b) => (Number(b.featured) - Number(a.featured)) || a.name.localeCompare(b.name));

      const meta = $("#resultsMeta");
      if (meta) meta.textContent = `${items.length} item${items.length === 1 ? "" : "s"} shown`;

      const grid = $("#productGrid");
      if (!grid) return;

      grid.innerHTML = items.map(p => `
        <article class="card product-card">
          <a class="product-media" href="#/product/${p.id}" aria-label="View ${escapeHtml(p.name)}">
            <img alt="${escapeHtml(p.name)}" src="${productImageDataUrl(p)}" loading="lazy"/>
          </a>
          <div class="product-body">
            <div class="flex between" style="gap: 10px">
              <div class="small muted">${escapeHtml(p.category)}</div>
              <div class="small muted">${p.inventory > 0 ? `${p.inventory} in stock` : "Out of stock"}</div>
            </div>
            <h3 class="product-title">${escapeHtml(p.name)}</h3>
            <div class="flex between" style="gap: 10px">
              <div class="price">${money(p.price)}</div>
              <button type="button" class="btn btn-ghost" data-add="${p.id}" ${p.inventory <= 0 ? "disabled" : ""}>
                Add to cart
              </button>
            </div>
          </div>
        </article>
      `).join("");

      $$("button[data-add]", grid).forEach(btn => {
        btn.addEventListener("click", () => addToCart(btn.getAttribute("data-add"), { qty: 1 }));
      });
    }

    // Events
    $("#categoryChips").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      state.catalog.category = btn.getAttribute("data-cat");
      $$("#categoryChips .chip").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      applyAndRender();
    });

    searchInput.addEventListener("input", () => {
      state.catalog.q = searchInput.value;
      applyAndRender();
    });

    sortSelect.addEventListener("change", () => {
      state.catalog.sort = sortSelect.value;
      applyAndRender();
    });

    // Hotkey: "/" focuses search
    window.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInput.focus();
      }
    }, { once: true });

    applyAndRender();

    // Optional: focus catalog if requested via query param (#/products?focus=catalog)
    try {
      const params = new URLSearchParams((getPath().split("?")[1] || ""));
      if (params.get("focus") === "catalog") {
        setTimeout(() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      }
    } catch {}
  }

  function renderProductDetail(id) {
    const p = productById(id);
    if (!p || !p.active) {
      renderNotice("Product not found", "That item doesn’t exist (or is inactive).", "warn", `<a class="btn btn-ghost" href="#/products">Back to products</a>`);
      return;
    }

    const img = productImageDataUrl(p);
    const sizes = p.sizes || [];
    const colors = p.colors || [];

    setHTML("#app", `
      <section class="card pad">
        <div class="flex between" style="gap: 12px; flex-wrap: wrap;">
          <div>
            <a class="muted small" href="#/products">← Back to catalog</a>
            <h2 style="margin: 6px 0 6px">${escapeHtml(p.name)}</h2>
            <div class="muted small">${escapeHtml(p.category)} • SKU ${escapeHtml(p.sku)}</div>
          </div>
          <div class="flex" style="flex-wrap: wrap">
            <span class="badge">${p.inventory > 0 ? `${p.inventory} in stock` : "Out of stock"}</span>
            <span class="badge">${money(p.price)}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="row cols-2">
          <div class="card" style="overflow:hidden">
            <img alt="${escapeHtml(p.name)}" src="${img}" style="display:block; width:100%; height:auto"/>
          </div>

          <div class="grid" style="gap: 14px">
            <p class="muted" style="margin: 0">${escapeHtml(p.description)}</p>

            <div class="row cols-2">
              <div class="field">
                <label class="label" for="sizeSelect">Size</label>
                <select id="sizeSelect">
                  ${sizes.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label class="label" for="colorSelect">Color</label>
                <select id="colorSelect">
                  ${colors.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="row cols-2">
              <div class="field">
                <label class="label" for="qtyInput">Quantity</label>
                <input id="qtyInput" class="input" type="number" min="1" max="99" value="1"/>
              </div>
              <div class="field">
                <label class="label">&nbsp;</label>
                <button id="addBtn" class="btn btn-primary" type="button" ${p.inventory <= 0 ? "disabled" : ""}>
                  Add to cart
                </button>
              </div>
            </div>

            <div class="notice warn small">
              Payment is a demo flow. In production, use a third‑party gateway (e.g., Stripe/PayPal) and never store card data.
            </div>

            <details class="card pad" style="background: color-mix(in srgb, var(--panel-2) 60%, transparent); box-shadow:none">
              <summary><strong>Details</strong> <span class="muted small">(materials, care, fit)</span></summary>
              <pre class="small muted" style="white-space:pre-wrap; margin: 10px 0 0">${escapeHtml(p.details)}</pre>
            </details>
          </div>
        </div>
      </section>
    `);

    $("#addBtn").addEventListener("click", () => {
      const size = $("#sizeSelect").value;
      const color = $("#colorSelect").value;
      const qty = Number($("#qtyInput").value || 1);
      addToCart(p.id, { qty, size, color });
      location.hash = "#/cart";
    });
  }

  function renderCart() {
    setHTML("#app", pageShell({
      title: "Shopping cart",
      subtitle: "Add/remove items and adjust quantities. Totals update automatically.",
      actionsHTML: `
        <a class="btn btn-ghost" href="#/products">Continue shopping</a>
        <button class="btn btn-danger" type="button" id="clearCartBtn" ${state.cart.length ? "" : "disabled"}>Clear cart</button>
      `
    }));

    const body = $("#pageBody");
    if (!state.cart.length) {
      body.innerHTML = `
        <div class="notice warn">
          <strong>Your cart is empty.</strong>
          <div class="small muted" style="margin-top:6px">Browse the catalog and add items to start checkout.</div>
        </div>
        <div style="margin-top: 14px">
          <a class="btn btn-primary" href="#/products">Go to products</a>
        </div>
      `;
      $("#clearCartBtn")?.addEventListener("click", clearCart);
      setCartCount();
      return;
    }

    const totals = cartTotals();

    body.innerHTML = `
      <div class="row cols-2">
        <div class="card pad" style="box-shadow:none">
          <table class="table" aria-label="Cart items">
            <thead>
              <tr>
                <th style="width:45%">Item</th>
                <th>Variant</th>
                <th style="width:110px">Qty</th>
                <th>Price</th>
                <th style="width:1px"></th>
              </tr>
            </thead>
            <tbody>
              ${state.cart.map(it => {
                const p = productById(it.productId);
                if (!p) return "";
                return `
                  <tr data-row="${it.id}">
                    <td>
                      <div class="flex" style="align-items:flex-start">
                        <img alt="" src="${productImageDataUrl(p)}" style="width:64px;height:44px;border-radius:10px;border:1px solid var(--border);object-fit:cover"/>
                        <div>
                          <div><a href="#/product/${p.id}"><strong>${escapeHtml(p.name)}</strong></a></div>
                          <div class="small muted">${escapeHtml(p.category)} • SKU ${escapeHtml(p.sku)}</div>
                        </div>
                      </div>
                    </td>
                    <td class="small muted">${escapeHtml(it.size)} • ${escapeHtml(it.color)}</td>
                    <td>
                      <input class="input" style="padding:10px" type="number" min="0" max="99" value="${it.qty}" data-qty="${it.id}" aria-label="Quantity for ${escapeHtml(p.name)}"/>
                      <div class="small muted" style="margin-top:6px">Stock: ${p.inventory}</div>
                    </td>
                    <td><strong>${money(p.price * it.qty)}</strong><div class="small muted">${money(p.price)} each</div></td>
                    <td><button class="btn btn-ghost" type="button" data-remove="${it.id}" aria-label="Remove item">Remove</button></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>

        <div class="card pad" style="box-shadow:none">
          <h3 style="margin:0 0 8px">Order summary</h3>
          <div class="divider"></div>
          <div class="grid" style="gap:10px">
            <div class="flex between"><span class="muted">Subtotal</span><strong id="sumSubtotal">${money(totals.subtotal)}</strong></div>
            <div class="flex between"><span class="muted">Tax (demo)</span><strong id="sumTax">${money(totals.tax)}</strong></div>
            <div class="flex between"><span class="muted">Shipping</span><strong id="sumShip">${money(totals.shipping)}</strong></div>
            <div class="divider"></div>
            <div class="flex between"><span>Estimated total</span><strong id="sumTotal">${money(totals.total)}</strong></div>

            <div class="notice ok small">
              Tip: orders are stored locally in your browser for this demo.
            </div>

            <a class="btn btn-primary" href="#/checkout">Checkout</a>
          </div>
        </div>
      </div>
    `;

    $("#clearCartBtn")?.addEventListener("click", () => {
      clearCart();
      renderCart();
    });

    $$("button[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        removeCartItem(btn.getAttribute("data-remove"));
        setCartCount();
        renderCart();
      });
    });

    $$("input[data-qty]").forEach(inp => {
      inp.addEventListener("input", () => {
        const id = inp.getAttribute("data-qty");
        updateCartItem(id, Number(inp.value));
        setCartCount();
        const t = cartTotals();
        setText("#sumSubtotal", money(t.subtotal));
        setText("#sumTax", money(t.tax));
        setText("#sumShip", money(t.shipping));
        setText("#sumTotal", money(t.total));
      });
    });

    setCartCount();
  }

  function renderCheckout() {
    if (!state.cart.length) {
      renderNotice("Your cart is empty", "Add items before checking out.", "warn",
        `<a class="btn btn-primary" href="#/products">Go to products</a>`);
      return;
    }

    // step param
    const path = getPath();
    const urlParams = new URLSearchParams(path.split("?")[1] || "");
    const step = clamp(urlParams.get("step") || state.checkout.step || 1, 1, 3);
    state.checkout.step = step;

    setHTML("#app", `
      <section class="card pad">
        <div class="flex between" style="gap: 12px; flex-wrap: wrap;">
          <div>
            <h2 style="margin: 0 0 6px">Checkout</h2>
            <p class="muted" style="margin: 0">Step‑by‑step shipping + payment (demo)</p>
          </div>
          <div class="steps" aria-label="Checkout steps">
            ${[
              { n: 1, label: "Shipping" },
              { n: 2, label: "Payment" },
              { n: 3, label: "Confirm" },
            ].map(s => `
              <span class="step ${s.n === step ? "active" : ""}">
                <span class="num">${s.n}</span>${s.label}
              </span>
            `).join("")}
          </div>
        </div>

        <div class="divider"></div>

        <div class="row cols-2">
          <div id="checkoutLeft"></div>
          <div id="checkoutRight"></div>
        </div>
      </section>
    `);

    renderCheckoutRight();

    if (step === 1) renderCheckoutShipping();
    if (step === 2) renderCheckoutPayment();
    if (step === 3) renderCheckoutConfirm();
  }

  function renderCheckoutRight() {
    const totals = cartTotals();
    const itemsHTML = state.cart.map(it => {
      const p = productById(it.productId);
      if (!p) return "";
      return `
        <div class="flex between" style="align-items:flex-start">
          <div class="flex" style="align-items:flex-start">
            <img alt="" src="${productImageDataUrl(p)}" style="width:62px;height:46px;border-radius:10px;border:1px solid var(--border);object-fit:cover"/>
            <div>
              <div class="small"><strong>${escapeHtml(p.name)}</strong> <span class="muted">× ${it.qty}</span></div>
              <div class="small muted">${escapeHtml(it.size)} • ${escapeHtml(it.color)}</div>
            </div>
          </div>
          <div class="small"><strong>${money(p.price * it.qty)}</strong></div>
        </div>
      `;
    }).join("");

    $("#checkoutRight").innerHTML = `
      <div class="card pad" style="box-shadow:none">
        <h3 style="margin:0 0 8px">Summary</h3>
        <div class="divider"></div>

        <div class="grid" style="gap: 10px">
          ${itemsHTML}
        </div>

        <div class="divider"></div>

        <div class="grid" style="gap:10px">
          <div class="flex between"><span class="muted">Subtotal</span><strong>${money(totals.subtotal)}</strong></div>
          <div class="flex between"><span class="muted">Tax</span><strong>${money(totals.tax)}</strong></div>
          <div class="flex between"><span class="muted">Shipping</span><strong>${money(totals.shipping)}</strong></div>
          <div class="divider"></div>
          <div class="flex between"><span>Total</span><strong>${money(totals.total)}</strong></div>
        </div>

        <div class="divider"></div>
        <div class="notice warn small">
          Demo checkout: do not enter real card numbers. Payments should be processed via a third‑party gateway in production.
        </div>
      </div>
    `;
  }

  function renderCheckoutShipping() {
    const left = $("#checkoutLeft");
    const user = isAuthed() ? getUserByEmail(state.session.email) : null;

    left.innerHTML = `
      <div class="card pad" style="box-shadow:none">
        <h3 style="margin:0 0 8px">Shipping info</h3>
        <div class="divider"></div>

        ${!isAuthed() ? `
          <div class="notice warn small">
            You can check out as a guest, but creating an account makes order history easier.
            <div style="margin-top:10px" class="flex" style="flex-wrap:wrap">
              <a class="btn btn-ghost" href="#/login?next=${encodeURIComponent("#/checkout?step=1")}">Login</a>
              <a class="btn btn-ghost" href="#/register?next=${encodeURIComponent("#/checkout?step=1")}">Register</a>
            </div>
          </div>
          <div class="divider"></div>
        ` : `
          <div class="notice ok small">
            Logged in as <strong>${escapeHtml(user?.name || state.session.email)}</strong> (${escapeHtml(state.session.role)}).
          </div>
          <div class="divider"></div>
        `}

        <form id="shipForm" class="grid" style="gap: 12px">
          <div class="row cols-2">
            <div class="field">
              <label class="label" for="shipName">Full name</label>
              <input class="input" id="shipName" name="name" autocomplete="name" required />
            </div>
            <div class="field">
              <label class="label" for="shipEmail">Email</label>
              <input class="input" id="shipEmail" name="email" autocomplete="email" type="email" required />
            </div>
          </div>

          <div class="field">
            <label class="label" for="shipAddr">Address</label>
            <input class="input" id="shipAddr" name="address" autocomplete="street-address" required />
          </div>

          <div class="row cols-2">
            <div class="field">
              <label class="label" for="shipCity">City</label>
              <input class="input" id="shipCity" name="city" autocomplete="address-level2" required />
            </div>
            <div class="field">
              <label class="label" for="shipState">State</label>
              <input class="input" id="shipState" name="state" autocomplete="address-level1" required />
            </div>
          </div>

          <div class="row cols-2">
            <div class="field">
              <label class="label" for="shipZip">ZIP</label>
              <input class="input" id="shipZip" name="zip" autocomplete="postal-code" required />
            </div>
            <div class="field">
              <label class="label" for="shipCountry">Country</label>
              <input class="input" id="shipCountry" name="country" autocomplete="country-name" required value="United States"/>
            </div>
          </div>

          <div class="flex between" style="gap: 12px; flex-wrap: wrap; margin-top: 6px">
            <a class="btn btn-ghost" href="#/cart">← Back to cart</a>
            <button class="btn btn-primary" type="submit">Continue to payment →</button>
          </div>
        </form>
      </div>
    `;

    // Prefill
    $("#shipName").value = user?.name || "";
    $("#shipEmail").value = user?.email || "";

    $("#shipForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const shipping = Object.fromEntries(fd.entries());
      shipping.email = normalizeEmail(shipping.email);
      state.checkout.shipping = shipping;
      audit("checkout.shipping", { email: shipping.email });

      location.hash = "#/checkout?step=2";
    });
  }

  function renderCheckoutPayment() {
    const left = $("#checkoutLeft");
    if (!state.checkout.shipping?.email) {
      location.hash = "#/checkout?step=1";
      return;
    }

    left.innerHTML = `
      <div class="card pad" style="box-shadow:none">
        <h3 style="margin:0 0 8px">Payment (demo)</h3>
        <div class="divider"></div>

        <div class="notice warn small">
          Do not enter real payment details here. In a real system, this step would be handled by a secure third‑party gateway.
        </div>

        <div class="divider"></div>

        <form id="payForm" class="grid" style="gap: 12px">
          <div class="row cols-2">
            <div class="field">
              <label class="label" for="cardName">Name on card</label>
              <input class="input" id="cardName" name="cardName" autocomplete="cc-name" required />
            </div>
            <div class="field">
              <label class="label" for="cardZip">Billing ZIP</label>
              <input class="input" id="cardZip" name="billingZip" autocomplete="postal-code" required />
            </div>
          </div>

          <div class="field">
            <label class="label" for="cardNum">Card number</label>
            <input class="input" id="cardNum" name="cardNum" inputmode="numeric" placeholder="4242 4242 4242 4242" required />
          </div>

          <div class="row cols-2">
            <div class="field">
              <label class="label" for="cardExp">Expiry</label>
              <input class="input" id="cardExp" name="exp" placeholder="MM/YY" autocomplete="cc-exp" required />
            </div>
            <div class="field">
              <label class="label" for="cardCvc">CVC</label>
              <input class="input" id="cardCvc" name="cvc" placeholder="123" autocomplete="cc-csc" required />
            </div>
          </div>

          <div class="flex between" style="gap: 12px; flex-wrap: wrap; margin-top: 6px">
            <a class="btn btn-ghost" href="#/checkout?step=1">← Back to shipping</a>
            <button class="btn btn-primary" type="submit">Review order →</button>
          </div>
        </form>

        <div class="divider"></div>
        <details class="small muted">
          <summary>Why no real payment here?</summary>
          A production site should use a PCI-compliant gateway and tokenize card data. This demo stores no card info.
        </details>
      </div>
    `;

    // Prefill
    $("#cardName").value = state.checkout.shipping?.name || "";

    $("#payForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);

      // Store only minimal info; never store card number in production.
      const cardNum = String(fd.get("cardNum") || "").replace(/\s+/g, "");
      const last4 = cardNum.slice(-4);

      state.checkout.payment = {
        cardName: String(fd.get("cardName") || ""),
        billingZip: String(fd.get("billingZip") || ""),
        brand: guessCardBrand(cardNum),
        last4,
        at: nowISO(),
      };

      audit("checkout.payment", { brand: state.checkout.payment.brand, last4 });

      // Clear sensitive raw inputs right away (best effort)
      e.target.reset();

      location.hash = "#/checkout?step=3";
    });
  }

  function guessCardBrand(num) {
    if (/^4/.test(num)) return "Visa";
    if (/^(5[1-5])/.test(num)) return "Mastercard";
    if (/^3[47]/.test(num)) return "AmEx";
    if (/^6/.test(num)) return "Discover";
    return "Card";
  }

  function renderCheckoutConfirm() {
    const left = $("#checkoutLeft");
    if (!state.checkout.shipping?.email || !state.checkout.payment?.last4) {
      location.hash = "#/checkout?step=1";
      return;
    }

    const totals = cartTotals();

    left.innerHTML = `
      <div class="card pad" style="box-shadow:none">
        <h3 style="margin:0 0 8px">Confirm your order</h3>
        <div class="divider"></div>

        <div class="grid" style="gap: 12px">
          <div class="notice ok small">
            <strong>Shipping to:</strong><br/>
            ${escapeHtml(state.checkout.shipping.name)}<br/>
            ${escapeHtml(state.checkout.shipping.address)}<br/>
            ${escapeHtml(state.checkout.shipping.city)}, ${escapeHtml(state.checkout.shipping.state)} ${escapeHtml(state.checkout.shipping.zip)}<br/>
            ${escapeHtml(state.checkout.shipping.country)}<br/>
            <span class="muted">${escapeHtml(state.checkout.shipping.email)}</span>
          </div>

          <div class="notice warn small">
            <strong>Payment:</strong> ${escapeHtml(state.checkout.payment.brand)} •••• ${escapeHtml(state.checkout.payment.last4)}
            <div class="muted">Processed by third‑party gateway (simulated)</div>
          </div>

          <div class="divider"></div>

          <div class="flex between">
            <span class="muted">Total</span>
            <strong style="font-size:18px">${money(totals.total)}</strong>
          </div>

          <div class="flex between" style="gap: 12px; flex-wrap: wrap; margin-top: 6px">
            <a class="btn btn-ghost" href="#/checkout?step=2">← Back to payment</a>
            <button class="btn btn-primary" type="button" id="placeOrderBtn">Place order</button>
          </div>

          <div class="small muted">
            By placing your order, you agree this is a class demo and your data is stored locally in your browser.
          </div>
        </div>
      </div>
    `;

    $("#placeOrderBtn").addEventListener("click", () => {
      // Inventory check
      for (const it of state.cart) {
        const p = productById(it.productId);
        if (!p) continue;
        if (it.qty > p.inventory) {
          toast(`Inventory changed for ${p.name}. Please update your cart.`, "warn");
          location.hash = "#/cart";
          return;
        }
      }

      // Deduct inventory
      for (const it of state.cart) {
        const p = productById(it.productId);
        if (!p) continue;
        p.inventory = Math.max(0, p.inventory - it.qty);
        p.updatedAt = nowISO();
      }
      saveProducts();

      // Create order
      const orderId = uid("order").replace("order_", "T4-");
      const order = {
        id: orderId,
        at: nowISO(),
        email: state.checkout.shipping.email,
        items: state.cart.map(it => ({ ...it })),
        totals,
        shipping: { ...state.checkout.shipping },
        payment: { brand: state.checkout.payment.brand, last4: state.checkout.payment.last4 },
        status: "Confirmed",
        history: [{ at: nowISO(), status: "Confirmed", note: "Order placed" }],
      };

      state.orders.unshift(order);
      saveOrders();
      audit("order.create", { orderId, email: order.email, total: totals.total });

      clearCart();
      state.checkout.step = 1;
      state.checkout.payment = null;
      // keep shipping for convenience
      toast("Order placed! 🎉", "ok");

      location.hash = `#/order/${encodeURIComponent(orderId)}`;
    });
  }

  function renderOrderConfirmation(orderId) {
    const id = decodeURIComponent(orderId);
    const order = state.orders.find(o => o.id === id);
    if (!order) {
      renderNotice("Order not found", "That order doesn’t exist in local storage.", "warn",
        `<a class="btn btn-ghost" href="#/products">Back to products</a>`);
      return;
    }

    const totals = order.totals;
    const itemsHTML = order.items.map(it => {
      const p = productById(it.productId) || { name: "Unknown item", price: 0, category: "" };
      return `
        <div class="flex between" style="align-items:flex-start">
          <div class="flex" style="align-items:flex-start">
            <img alt="" src="${productImageDataUrl(p)}" style="width:62px;height:46px;border-radius:10px;border:1px solid var(--border);object-fit:cover"/>
            <div>
              <div class="small"><strong>${escapeHtml(p.name)}</strong> <span class="muted">× ${it.qty}</span></div>
              <div class="small muted">${escapeHtml(it.size)} • ${escapeHtml(it.color)}</div>
            </div>
          </div>
          <div class="small"><strong>${money((p.price || 0) * it.qty)}</strong></div>
        </div>
      `;
    }).join("");

    setHTML("#app", `
      <section class="card pad">
        <div class="flex between" style="gap: 12px; flex-wrap: wrap;">
          <div>
            <h2 style="margin: 0 0 6px">Order confirmed</h2>
            <p class="muted" style="margin: 0">Order <strong>${escapeHtml(order.id)}</strong> • ${new Date(order.at).toLocaleString()}</p>
          </div>
          <div class="flex" style="flex-wrap: wrap">
            <span class="badge">${escapeHtml(order.status)}</span>
            <a class="btn btn-ghost" href="#/products">Keep shopping</a>
          </div>
        </div>

        <div class="divider"></div>

        <div class="row cols-2">
          <div class="card pad" style="box-shadow:none">
            <h3 style="margin:0 0 8px">Items</h3>
            <div class="divider"></div>
            <div class="grid" style="gap: 10px">
              ${itemsHTML}
            </div>

            <div class="divider"></div>

            <div class="grid" style="gap: 10px">
              <div class="flex between"><span class="muted">Subtotal</span><strong>${money(totals.subtotal)}</strong></div>
              <div class="flex between"><span class="muted">Tax</span><strong>${money(totals.tax)}</strong></div>
              <div class="flex between"><span class="muted">Shipping</span><strong>${money(totals.shipping)}</strong></div>
              <div class="divider"></div>
              <div class="flex between"><span>Total</span><strong>${money(totals.total)}</strong></div>
            </div>
          </div>

          <div class="grid" style="gap: 12px">
            <div class="notice ok small">
              <strong>Shipping</strong><br/>
              ${escapeHtml(order.shipping.name)}<br/>
              ${escapeHtml(order.shipping.address)}<br/>
              ${escapeHtml(order.shipping.city)}, ${escapeHtml(order.shipping.state)} ${escapeHtml(order.shipping.zip)}<br/>
              ${escapeHtml(order.shipping.country)}
              <div class="muted" style="margin-top: 6px">${escapeHtml(order.email)}</div>
            </div>

            <div class="notice warn small">
              <strong>Payment</strong><br/>
              ${escapeHtml(order.payment.brand)} •••• ${escapeHtml(order.payment.last4)}<br/>
              <span class="muted">Gateway: simulated</span>
            </div>

            <div class="card pad" style="box-shadow:none">
              <strong>Status history</strong>
              <div class="divider"></div>
              <div class="grid" style="gap: 8px">
                ${order.history.map(h => `
                  <div class="small">
                    <strong>${escapeHtml(h.status)}</strong>
                    <div class="muted">${new Date(h.at).toLocaleString()}${h.note ? ` • ${escapeHtml(h.note)}` : ""}</div>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="card pad" style="box-shadow:none">
              <strong>Want order history?</strong>
              <div class="small muted" style="margin-top:6px">
                If you create an account using <strong>${escapeHtml(order.email)}</strong>,
                this order will show up in your account page (demo behavior).
              </div>
              <div class="divider"></div>
              <div class="flex" style="flex-wrap: wrap">
                <a class="btn btn-ghost" href="#/register">Create account</a>
                <a class="btn btn-ghost" href="#/login">Login</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    `);
  }

  function renderLogin() {
    const params = new URLSearchParams(getPath().split("?")[1] || "");
    const next = params.get("next") ? decodeURIComponent(params.get("next")) : "#/account";

    setHTML("#app", `
      <section class="card pad">
        <div class="row cols-2">
          <div>
            <h2 style="margin:0 0 8px">Login</h2>
            <p class="muted" style="margin:0">
              Sign in to view your profile and order history.
            </p>

            <div class="divider"></div>

            <form id="loginForm" class="grid" style="gap: 12px">
              <div class="field">
                <label class="label" for="loginEmail">Email</label>
                <input class="input" id="loginEmail" name="email" type="email" autocomplete="email" required />
              </div>
              <div class="field">
                <label class="label" for="loginPass">Password</label>
                <input class="input" id="loginPass" name="password" type="password" autocomplete="current-password" required />
              </div>

              <button class="btn btn-primary" type="submit">Login</button>

              <div class="small muted">
                No account? <a href="#/register">Register here</a>.
              </div>
            </form>
          </div>

          <div class="card pad" style="box-shadow:none">
            <strong>Demo accounts</strong>
            <div class="small muted" style="margin-top:6px">Use these to test role-based access control:</div>
            <div class="divider"></div>
            <table class="table">
              <thead><tr><th>Role</th><th>Email</th><th>Password</th></tr></thead>
              <tbody>
                <tr><td>Admin</td><td><span class="kbd">admin@team4.local</span></td><td><span class="kbd">Admin123!</span></td></tr>
                <tr><td>Management</td><td><span class="kbd">manager@team4.local</span></td><td><span class="kbd">Manager123!</span></td></tr>
                <tr><td>Employee</td><td><span class="kbd">employee@team4.local</span></td><td><span class="kbd">Employee123!</span></td></tr>
                <tr><td>Customer</td><td><span class="kbd">customer@team4.local</span></td><td><span class="kbd">Customer123!</span></td></tr>
              </tbody>
            </table>
            <div class="divider"></div>
            <div class="notice warn small">
              Passwords are hashed (SHA‑256) in local storage for the demo, but a real system must use a server + salted hashing.
            </div>
          </div>
        </div>
      </section>
    `);

    $("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const email = String(fd.get("email") || "");
      const password = String(fd.get("password") || "");

      try {
        await login({ email, password });
        updateHeaderAuth();
        setCartCount();
        toast("Welcome back!", "ok");
        location.hash = next;
      } catch (err) {
        toast(err.message || "Login failed.", "danger");
      }
    });
  }

  function renderRegister() {
    const params = new URLSearchParams(getPath().split("?")[1] || "");
    const next = params.get("next") ? decodeURIComponent(params.get("next")) : "#/account";

    setHTML("#app", `
      <section class="card pad">
        <div class="row cols-2">
          <div>
            <h2 style="margin:0 0 8px">Create account</h2>
            <p class="muted" style="margin:0">Register to save your info and view order history.</p>

            <div class="divider"></div>

            <form id="regForm" class="grid" style="gap: 12px">
              <div class="field">
                <label class="label" for="regName">Name</label>
                <input class="input" id="regName" name="name" autocomplete="name" required />
              </div>

              <div class="field">
                <label class="label" for="regEmail">Email</label>
                <input class="input" id="regEmail" name="email" type="email" autocomplete="email" required />
              </div>

              <div class="field">
                <label class="label" for="regPass">Password</label>
                <input class="input" id="regPass" name="password" type="password" autocomplete="new-password" minlength="8" required />
                <div class="small muted" style="margin-top:6px">Use 8+ characters. Demo stores a SHA‑256 hash in local storage.</div>
              </div>

              <button class="btn btn-primary" type="submit">Create account</button>

              <div class="small muted">
                Already have an account? <a href="#/login">Login</a>.
              </div>
            </form>
          </div>

          <div class="card pad" style="box-shadow:none">
            <strong>What you get</strong>
            <div class="divider"></div>
            <ul class="muted" style="margin:0; padding-left: 18px">
              <li>Faster checkout (prefilled email/name)</li>
              <li>Order confirmation + order history</li>
              <li>Access to customer-only profile tools</li>
            </ul>
            <div class="divider"></div>
            <div class="notice ok small">
              If you register using the same email you used at checkout, your past demo orders will appear in your account.
            </div>
          </div>
        </div>
      </section>
    `);

    $("#regForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = String(fd.get("name") || "");
      const email = String(fd.get("email") || "");
      const password = String(fd.get("password") || "");
      try {
        await register({ name, email, password });
        await login({ email, password });
        updateHeaderAuth();
        toast("Account created!", "ok");
        location.hash = next;
      } catch (err) {
        toast(err.message || "Registration failed.", "danger");
      }
    });
  }

  function renderAccount() {
    if (!requireAuth("#/account")) return;

    const user = getUserByEmail(state.session.email);
    if (!user) {
      logout();
      return;
    }

    const myOrders = state.orders.filter(o => normalizeEmail(o.email) === user.email);

    setHTML("#app", `
      <section class="card pad">
        <div class="flex between" style="gap: 12px; flex-wrap: wrap;">
          <div>
            <h2 style="margin: 0 0 6px">Account</h2>
            <p class="muted" style="margin: 0">${escapeHtml(user.name)} • ${escapeHtml(user.email)} • <span class="badge">${escapeHtml(user.role)}</span></p>
          </div>
          <div class="flex" style="flex-wrap: wrap">
            ${hasRoleAtLeast("employee") ? `<a class="btn btn-ghost" href="#/admin">Admin tools</a>` : ""}
            <button class="btn btn-danger" id="logoutBtn" type="button">Logout</button>
          </div>
        </div>

        <div class="divider"></div>

        <div class="row cols-2">
          <div class="card pad" style="box-shadow:none">
            <h3 style="margin:0 0 8px">Profile</h3>
            <div class="divider"></div>

            <form id="profileForm" class="grid" style="gap:12px">
              <div class="field">
                <label class="label" for="profName">Name</label>
                <input class="input" id="profName" name="name" value="${escapeHtml(user.name)}" required />
              </div>

              <div class="notice warn small">
                Security note: In production, profiles would be stored server-side with strict access controls and audit logs.
              </div>

              <button class="btn btn-primary" type="submit">Save changes</button>
            </form>
          </div>

          <div class="card pad" style="box-shadow:none">
            <h3 style="margin:0 0 8px">Order history</h3>
            <div class="divider"></div>

            ${myOrders.length ? `
              <div class="grid" style="gap: 10px">
                ${myOrders.map(o => `
                  <a class="card pad" style="box-shadow:none" href="#/order/${encodeURIComponent(o.id)}">
                    <div class="flex between">
                      <strong>${escapeHtml(o.id)}</strong>
                      <span class="badge">${escapeHtml(o.status)}</span>
                    </div>
                    <div class="small muted">${new Date(o.at).toLocaleString()} • Total ${money(o.totals.total)}</div>
                  </a>
                `).join("")}
              </div>
            ` : `
              <div class="notice warn small">
                No orders yet. <a href="#/products">Shop products</a>.
              </div>
            `}
          </div>
        </div>
      </section>
    `);

    $("#logoutBtn").addEventListener("click", logout);

    $("#profileForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      user.name = String(fd.get("name") || "Customer").trim() || "Customer";
      saveUsers();
      state.session.name = user.name;
      saveSession();
      audit("user.profileUpdate", { email: user.email });
      updateHeaderAuth();
      toast("Profile updated.", "ok");
      renderAccount();
    });
  }

  function renderAdmin() {
    if (!requireRoleAtLeast("employee", "#/admin")) return;

    const role = state.session.role;
    const canEditProducts = hasRoleAtLeast("management");
    const canEditUsers = hasRoleAtLeast("admin");
    const canUpdateOrders = hasRoleAtLeast("management");

    const tab = (new URLSearchParams(getPath().split("?")[1] || "")).get("tab") || "products";

    setHTML("#app", `
      <section class="card pad">
        <div class="flex between" style="gap: 12px; flex-wrap: wrap;">
          <div>
            <h2 style="margin: 0 0 6px">Admin tools</h2>
            <p class="muted" style="margin: 0">
              Role‑based access • Logged in as <strong>${escapeHtml(state.session.email)}</strong> (<span class="badge">${escapeHtml(role)}</span>)
            </p>
          </div>
          <div class="flex" style="flex-wrap: wrap">
            <a class="btn btn-ghost" href="#/account">Account</a>
            <button class="btn btn-danger" id="logoutBtn" type="button">Logout</button>
          </div>
        </div>

        <div class="divider"></div>

        <div class="chip-row" id="adminTabs">
          ${[
            { id: "products", label: "Products" },
            { id: "orders", label: "Orders" },
            { id: "requests", label: "Customer requests" },
            { id: "users", label: "Users", hide: !canEditUsers },
            { id: "audit", label: "Audit log", hide: !hasRoleAtLeast("admin") },
          ].filter(t => !t.hide).map(t => `
            <a class="chip ${tab === t.id ? "active" : ""}" href="#/admin?tab=${t.id}">${t.label}</a>
          `).join("")}
        </div>

        <div class="divider"></div>

        <div id="adminBody"></div>
      </section>
    `);

    $("#logoutBtn").addEventListener("click", logout);

    if (tab === "products") renderAdminProducts({ canEdit: canEditProducts });
    if (tab === "orders") renderAdminOrders({ canUpdate: canUpdateOrders });
    if (tab === "requests") renderAdminRequests();
    if (tab === "users") renderAdminUsers({ canEdit: canEditUsers });
    if (tab === "audit") renderAdminAudit();
  }

  function renderAdminProducts({ canEdit }) {
    const body = $("#adminBody");
    const categories = ["Men", "Women", "Shoes", "Accessories", "Sale"];

    body.innerHTML = `
      <div class="row cols-2">
        <div class="card pad" style="box-shadow:none">
          <h3 style="margin:0 0 8px">Inventory & listings</h3>
          <div class="small muted">Employees can view. Management/Admin can add/edit.</div>
          <div class="divider"></div>

          <table class="table" aria-label="Products table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th style="width:1px"></th>
              </tr>
            </thead>
            <tbody>
              ${state.products.map(p => `
                <tr>
                  <td class="small muted">${escapeHtml(p.sku)}</td>
                  <td><a href="#/product/${p.id}"><strong>${escapeHtml(p.name)}</strong></a></td>
                  <td class="small muted">${escapeHtml(p.category)}</td>
                  <td><strong>${money(p.price)}</strong></td>
                  <td>
                    <span class="badge">${p.inventory}</span>
                    ${p.inventory <= 0 ? `<span class="badge" style="border-color: color-mix(in srgb, var(--danger) 45%, transparent)">Out</span>` : ""}
                  </td>
                  <td>
                    ${canEdit ? `
                      <button class="btn btn-ghost" type="button" data-edit="${p.id}">Edit</button>
                      <button class="btn btn-danger" type="button" data-del="${p.id}">Delete</button>
                    ` : `<span class="small muted">View only</span>`}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div class="card pad" style="box-shadow:none">
          <h3 style="margin:0 0 8px">${canEdit ? "Add / edit product" : "Add / edit product (locked)"}</h3>
          <div class="small muted">${canEdit ? "Create new products, update pricing and inventory." : "You need Management or Admin role to edit products."}</div>
          <div class="divider"></div>

          <form id="prodForm" class="grid" style="gap: 12px">
            <input type="hidden" id="prodId" name="id" />
            <div class="field">
              <label class="label" for="prodName">Name</label>
              <input class="input" id="prodName" name="name" required ${canEdit ? "" : "disabled"} />
            </div>

            <div class="row cols-2">
              <div class="field">
                <label class="label" for="prodCat">Category</label>
                <select id="prodCat" name="category" ${canEdit ? "" : "disabled"}>
                  ${categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
                </select>
              </div>

              <div class="field">
                <label class="label" for="prodPrice">Price</label>
                <input class="input" id="prodPrice" name="price" type="number" min="0" step="0.01" required ${canEdit ? "" : "disabled"} />
              </div>
            </div>

            <div class="row cols-2">
              <div class="field">
                <label class="label" for="prodInv">Inventory</label>
                <input class="input" id="prodInv" name="inventory" type="number" min="0" step="1" required ${canEdit ? "" : "disabled"} />
              </div>
              <div class="field">
                <label class="label" for="prodFeatured">Featured</label>
                <select id="prodFeatured" name="featured" ${canEdit ? "" : "disabled"}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label class="label" for="prodDesc">Short description</label>
              <textarea id="prodDesc" name="description" ${canEdit ? "" : "disabled"}></textarea>
            </div>

            <div class="flex between" style="gap: 10px; flex-wrap: wrap">
              <button class="btn btn-ghost" type="button" id="prodReset" ${canEdit ? "" : "disabled"}>Reset</button>
              <button class="btn btn-primary" type="submit" ${canEdit ? "" : "disabled"}>Save product</button>
            </div>

            <div class="notice warn small">
              Demo note: all changes are stored in localStorage and will only appear on this browser/device.
            </div>
          </form>
        </div>
      </div>
    `;

    $("#prodReset").addEventListener("click", () => resetProdForm());
    const form = $("#prodForm");

    function resetProdForm() {
      form.reset();
      $("#prodId").value = "";
      $("#prodDesc").value = "";
    }

    if (canEdit) {
      $$("button[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-edit");
          const p = productById(id);
          if (!p) return;
          $("#prodId").value = p.id;
          $("#prodName").value = p.name;
          $("#prodCat").value = p.category;
          $("#prodPrice").value = String(p.price);
          $("#prodInv").value = String(p.inventory);
          $("#prodFeatured").value = String(Boolean(p.featured));
          $("#prodDesc").value = p.description || "";
          toast("Editing product. Update fields and save.", "ok");
        });
      });

      $$("button[data-del]").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-del");
          const p = productById(id);
          if (!p) return;
          const ok = confirm(`Delete "${p.name}"? This cannot be undone in the demo.`);
          if (!ok) return;
          state.products = state.products.filter(x => x.id !== id);
          saveProducts();
          audit("product.delete", { id, sku: p.sku, name: p.name });
          toast("Product deleted.", "ok");
          renderAdmin();
        });
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const id = String(fd.get("id") || "");
        const name = String(fd.get("name") || "").trim();
        const category = String(fd.get("category") || "Men");
        const price = Number(fd.get("price") || 0);
        const inventory = Math.max(0, Math.floor(Number(fd.get("inventory") || 0)));
        const featured = String(fd.get("featured") || "false") === "true";
        const description = String(fd.get("description") || "");

        if (!name) { toast("Name is required.", "danger"); return; }

        if (id) {
          const p = productById(id);
          if (!p) return;
          p.name = name;
          p.category = category;
          p.price = price;
          p.inventory = inventory;
          p.featured = featured;
          p.description = description;
          p.updatedAt = nowISO();
          audit("product.update", { id: p.id, sku: p.sku });
        } else {
          const newId = uid("p").replace("p_", "");
          const sku = `T4-${category.slice(0, 2).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
          state.products.unshift({
            id: newId,
            sku,
            name,
            category,
            price,
            inventory,
            description,
            details: `${description}\n\nDetails:\n• Materials: Varies\n• Care: Follow label\n• Fit: True to size`,
            sizes: category === "Shoes" ? ["7","8","9","10","11","12"] : ["XS","S","M","L","XL"],
            colors: ["Black","White","Navy","Sand","Olive"],
            tags: [],
            featured,
            createdAt: nowISO(),
            updatedAt: nowISO(),
            active: true,
          });
          audit("product.create", { id: newId, sku, name });
        }

        saveProducts();
        toast("Saved.", "ok");
        resetProdForm();
        renderAdmin();
      });
    }
  }

  function renderAdminOrders({ canUpdate }) {
    const body = $("#adminBody");
    const statuses = ["Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

    body.innerHTML = `
      <div class="card pad" style="box-shadow:none">
        <h3 style="margin:0 0 8px">Orders</h3>
        <div class="small muted">Employees can view. Management/Admin can update status.</div>
        <div class="divider"></div>

        ${state.orders.length ? `
          <table class="table" aria-label="Orders table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Email</th>
                <th>Placed</th>
                <th>Total</th>
                <th>Status</th>
                <th style="width:1px"></th>
              </tr>
            </thead>
            <tbody>
              ${state.orders.map(o => `
                <tr>
                  <td><a href="#/order/${encodeURIComponent(o.id)}"><strong>${escapeHtml(o.id)}</strong></a></td>
                  <td class="small muted">${escapeHtml(o.email)}</td>
                  <td class="small muted">${new Date(o.at).toLocaleString()}</td>
                  <td><strong>${money(o.totals.total)}</strong></td>
                  <td>
                    ${canUpdate ? `
                      <select data-status="${escapeHtml(o.id)}">
                        ${statuses.map(s => `<option value="${escapeHtml(s)}" ${o.status === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
                      </select>
                    ` : `<span class="badge">${escapeHtml(o.status)}</span>`}
                  </td>
                  <td>${canUpdate ? `<button class="btn btn-ghost" type="button" data-note="${escapeHtml(o.id)}">Add note</button>` : ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `
          <div class="notice warn small">
            No orders yet. Place an order through the checkout flow to see it here.
          </div>
        `}
      </div>
    `;

    if (!canUpdate) return;

    $$("select[data-status]").forEach(sel => {
      sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-status");
        const order = state.orders.find(o => o.id === id);
        if (!order) return;
        const newStatus = sel.value;
        order.status = newStatus;
        order.history.unshift({ at: nowISO(), status: newStatus, note: "Status updated by staff" });
        saveOrders();
        audit("order.statusUpdate", { id, status: newStatus });
        toast("Order status updated.", "ok");
      });
    });

    $$("button[data-note]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-note");
        const order = state.orders.find(o => o.id === id);
        if (!order) return;
        const note = prompt("Add an internal note (demo):");
        if (!note) return;
        order.history.unshift({ at: nowISO(), status: order.status, note });
        saveOrders();
        audit("order.note", { id });
        toast("Note added.", "ok");
      });
    });
  }

  function renderAdminRequests() {
    const body = $("#adminBody");

    body.innerHTML = `
      <div class="card pad" style="box-shadow:none">
        <h3 style="margin:0 0 8px">Customer requests</h3>
        <div class="small muted">Messages sent from the Contact page.</div>
        <div class="divider"></div>

        ${state.messages.length ? `
          <div class="grid" style="gap: 10px">
            ${state.messages.map(m => `
              <div class="card pad" style="box-shadow:none">
                <div class="flex between">
                  <strong>${escapeHtml(m.name || "Anonymous")}</strong>
                  <span class="badge">${new Date(m.at).toLocaleString()}</span>
                </div>
                <div class="small muted">${escapeHtml(m.email || "")}</div>
                <div class="divider"></div>
                <div>${escapeHtml(m.message || "")}</div>
              </div>
            `).join("")}
          </div>
        ` : `
          <div class="notice warn small">No messages yet.</div>
        `}
      </div>
    `;
  }

  function renderAdminUsers({ canEdit }) {
    const body = $("#adminBody");
    if (!canEdit) {
      body.innerHTML = `<div class="notice warn">Admin access required.</div>`;
      return;
    }

    body.innerHTML = `
      <div class="card pad" style="box-shadow:none">
        <h3 style="margin:0 0 8px">Users</h3>
        <div class="small muted">Admins can manage roles and disable accounts (demo).</div>
        <div class="divider"></div>

        <table class="table" aria-label="Users table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Created</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${state.users.map(u => `
              <tr>
                <td><span class="kbd">${escapeHtml(u.email)}</span></td>
                <td>${escapeHtml(u.name)}</td>
                <td>
                  <select data-role="${escapeHtml(u.email)}" ${u.email === state.session.email ? "disabled" : ""}>
                    ${ROLES.map(r => `<option value="${escapeHtml(r)}" ${u.role === r ? "selected" : ""}>${escapeHtml(r)}</option>`).join("")}
                  </select>
                </td>
                <td class="small muted">${new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <label class="small muted">
                    <input type="checkbox" data-disable="${escapeHtml(u.email)}" ${u.disabled ? "checked" : ""} ${u.email === state.session.email ? "disabled" : ""}/>
                    Disabled
                  </label>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="divider"></div>
        <div class="notice warn small">
          Security note: A real admin panel would require strong authentication (MFA), server-side authorization, and detailed audit logging.
        </div>
      </div>
    `;

    $$("select[data-role]").forEach(sel => {
      sel.addEventListener("change", () => {
        const email = sel.getAttribute("data-role");
        const u = getUserByEmail(email);
        if (!u) return;
        u.role = sel.value;
        saveUsers();
        audit("user.roleChange", { email: u.email, role: u.role });
        toast("Role updated.", "ok");
        renderAdmin();
      });
    });

    $$("input[data-disable]").forEach(chk => {
      chk.addEventListener("change", () => {
        const email = chk.getAttribute("data-disable");
        const u = getUserByEmail(email);
        if (!u) return;
        u.disabled = chk.checked;
        saveUsers();
        audit("user.disableToggle", { email: u.email, disabled: u.disabled });
        toast(u.disabled ? "User disabled." : "User enabled.", "ok");
      });
    });
  }

  function renderAdminAudit() {
    const body = $("#adminBody");
    body.innerHTML = `
      <div class="card pad" style="box-shadow:none">
        <h3 style="margin:0 0 8px">Audit log</h3>
        <div class="small muted">Tracks actions like logins, product edits, and order updates (demo).</div>
        <div class="divider"></div>

        ${state.audit.length ? `
          <table class="table" aria-label="Audit table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${state.audit.map(a => `
                <tr>
                  <td class="small muted">${new Date(a.at).toLocaleString()}</td>
                  <td class="small muted">${escapeHtml(a.by)}<br/><span class="badge">${escapeHtml(a.role)}</span></td>
                  <td><strong>${escapeHtml(a.action)}</strong></td>
                  <td class="small muted"><pre style="margin:0;white-space:pre-wrap">${escapeHtml(JSON.stringify(a.detail || {}, null, 2))}</pre></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `
          <div class="notice warn small">No events yet.</div>
        `}

        <div class="divider"></div>
        <button class="btn btn-danger" type="button" id="clearAuditBtn">Clear audit log</button>
      </div>
    `;

    $("#clearAuditBtn").addEventListener("click", () => {
      const ok = confirm("Clear audit log?");
      if (!ok) return;
      state.audit = [];
      saveAudit();
      toast("Audit log cleared.", "ok");
      renderAdmin();
    });
  }

  function renderAbout() {
    setHTML("#app", `
      <section class="card pad">
        <h2 style="margin:0 0 8px">About this project</h2>
        <p class="muted" style="margin:0">
          Team 4 Apparel is a demo e‑commerce website for an apparel store: browse products, view details, manage a cart, and check out.
        </p>

        <div class="divider"></div>

        <div class="row cols-2">
          <div class="card pad" style="box-shadow:none">
            <strong>What’s included</strong>
            <div class="divider"></div>
            <ul class="muted" style="margin:0; padding-left: 18px">
              <li>Product catalog (browse, search, filter)</li>
              <li>Product detail pages (images, price, description)</li>
              <li>User accounts (register/login) + profile</li>
              <li>Shopping cart (add/remove items, update quantities)</li>
              <li>Checkout (shipping + payment) with order confirmation</li>
              <li>Order history</li>
              <li>Role-based admin panel (employee/management/admin)</li>
              <li>Responsive design for mobile + desktop</li>
            </ul>
          </div>

          <div class="card pad" style="box-shadow:none">
            <strong>How to use it</strong>
            <div class="divider"></div>
            <ol class="muted" style="margin:0; padding-left: 18px">
              <li>Open <span class="kbd">index.html</span> with a local web server</li>
              <li>Browse products and add items to your cart</li>
              <li>Checkout (demo payment) and place an order</li>
              <li>Login to see account + order history</li>
              <li>Login as employee/manager/admin to view admin tools</li>
            </ol>

            <div class="divider"></div>
            <div class="notice ok small">
              Tip: To reset the demo, clear your browser localStorage for this site.
            </div>
          </div>
        </div>
      </section>
    `);
  }

  function renderContact() {
    setHTML("#app", `
      <section class="card pad">
        <h2 style="margin:0 0 8px">Contact</h2>
        <p class="muted" style="margin:0">
          Send a message to the store team. For this demo, messages are stored locally and visible in Admin → Customer requests.
        </p>

        <div class="divider"></div>

        <div class="row cols-2">
          <form id="contactForm" class="card pad" style="box-shadow:none">
            <div class="grid" style="gap: 12px">
              <div class="field">
                <label class="label" for="cName">Name</label>
                <input class="input" id="cName" name="name" autocomplete="name" />
              </div>

              <div class="field">
                <label class="label" for="cEmail">Email</label>
                <input class="input" id="cEmail" name="email" type="email" autocomplete="email" />
              </div>

              <div class="field">
                <label class="label" for="cMsg">Message</label>
                <textarea id="cMsg" name="message" required placeholder="How can we help?"></textarea>
              </div>

              <button class="btn btn-primary" type="submit">Send message</button>

              <div class="small muted">
                Demo note: no emails are sent. In production, integrate an email provider and keep audit logs.
              </div>
            </div>
          </form>

          <div class="card pad" style="box-shadow:none">
            <strong>Where messages go</strong>
            <div class="divider"></div>
            <p class="muted" style="margin:0">
              Employees and managers can view messages at <span class="kbd">Admin → Customer requests</span>.
              This helps store staff respond to customer needs.
            </p>

            <div class="divider"></div>

            <div class="notice warn small">
              Privacy: This demo stores messages in your browser localStorage. Avoid personal or sensitive data.
            </div>

            <div style="margin-top: 12px" class="flex" style="flex-wrap: wrap">
              ${hasRoleAtLeast("employee") ? `<a class="btn btn-ghost" href="#/admin?tab=requests">Open Admin → Requests</a>` : `<a class="btn btn-ghost" href="#/login">Login to view admin tools</a>`}
            </div>
          </div>
        </div>
      </section>
    `);

    const user = isAuthed() ? getUserByEmail(state.session.email) : null;
    $("#cName").value = user?.name || "";
    $("#cEmail").value = user?.email || "";

    $("#contactForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const msg = {
        id: uid("msg"),
        at: nowISO(),
        name: String(fd.get("name") || ""),
        email: normalizeEmail(fd.get("email") || ""),
        message: String(fd.get("message") || ""),
      };
      state.messages.unshift(msg);
      saveMessages();
      audit("contact.submit", { email: msg.email || "unknown" });
      e.target.reset();
      toast("Message saved (demo).", "ok");
    });
  }

  function renderSecurity() {
    setHTML("#app", `
      <section class="card pad">
        <h2 style="margin:0 0 8px">Security &amp; reliability</h2>
        <p class="muted" style="margin:0">
          This page summarizes how a real e‑commerce site should handle performance, uptime, data protection, access control, and compliance —
          plus what this front‑end demo does and does not implement.
        </p>

        <div class="divider"></div>

        <div class="row cols-2">
          <div class="card pad" style="box-shadow:none">
            <strong>What the demo implements</strong>
            <div class="divider"></div>
            <ul class="muted" style="margin:0; padding-left: 18px">
              <li>Role-based access control (customer/employee/management/admin)</li>
              <li>Session auto-expire after inactivity (${IDLE_MINUTES} minutes)</li>
              <li>Password hashing (SHA‑256) in localStorage (demo only)</li>
              <li>Audit log for admin actions (demo)</li>
              <li>“No card storage” approach in checkout (demo simulates a gateway)</li>
            </ul>
          </div>

          <div class="card pad" style="box-shadow:none">
            <strong>What a production system should add</strong>
            <div class="divider"></div>
            <ul class="muted" style="margin:0; padding-left: 18px">
              <li>HTTPS everywhere (TLS) + secure headers</li>
              <li>Server-side authentication with salted password hashing (e.g., bcrypt/argon2)</li>
              <li>PCI-DSS compliant payment processing via third‑party gateway</li>
              <li>99.9%+ uptime with monitoring, backups, and failover</li>
              <li>Privacy compliance for user data + audit trails for sensitive changes</li>
              <li>Rate limiting, CSRF protection, input validation, and logging</li>
            </ul>
          </div>
        </div>

        <div class="divider"></div>

        <div class="card pad" style="box-shadow:none">
          <strong>Performance targets (typical)</strong>
          <div class="divider"></div>
          <div class="grid cols-3">
            <div class="notice ok">
              <strong>Speed</strong>
              <div class="small muted" style="margin-top:6px">Aim for fast interactions (e.g., 2–3 seconds page loads).</div>
            </div>
            <div class="notice ok">
              <strong>Reliability</strong>
              <div class="small muted" style="margin-top:6px">High uptime with safe, reliable transactions and order processing.</div>
            </div>
            <div class="notice ok">
              <strong>Scalability</strong>
              <div class="small muted" style="margin-top:6px">Handle traffic spikes during promotions and holidays.</div>
            </div>
          </div>
        </div>
      </section>
    `);
  }

  function renderDenied() {
    renderNotice(
      "Access denied",
      "You don’t have permission to view that page. If you think this is a mistake, log in with a different role.",
      "danger",
      `<a class="btn btn-ghost" href="#/login">Login</a> <a class="btn btn-primary" href="#/products">Go to products</a>`
    );
  }

  function renderNotFound() {
    renderNotice("Page not found", "That route doesn’t exist.", "warn", `<a class="btn btn-primary" href="#/products">Home</a>`);
  }

  // ---------- Router ----------
  function getPath() {
    const hash = location.hash || "#/products";
    const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
    return cleaned || "/products";
  }

  function getRouteParts() {
    const path = getPath();
    const [pathname, query] = path.split("?");
    const parts = pathname.split("/").filter(Boolean);
    return { pathname, query: query || "", parts };
  }

  function route() {
    checkIdleLogout();
    touchSession();

    updateHeaderAuth();
    setActiveNav();
    setCartCount();

    const { parts } = getRouteParts();

    // Routes:
    // /products
    // /product/:id
    // /cart
    // /checkout
    // /order/:id
    // /login, /register
    // /account
    // /admin
    // /about, /contact, /security
    // /denied

    const head = parts[0] || "products";

    if (head === "products") return renderProducts();
    if (head === "product") return renderProductDetail(parts[1]);
    if (head === "cart") return renderCart();
    if (head === "checkout") return renderCheckout();
    if (head === "order") return renderOrderConfirmation(parts[1] || "");
    if (head === "login") return renderLogin();
    if (head === "register") return renderRegister();
    if (head === "account") return renderAccount();
    if (head === "admin") return renderAdmin();
    if (head === "about") return renderAbout();
    if (head === "contact") return renderContact();
    if (head === "security") return renderSecurity();
    if (head === "denied") return renderDenied();

    return renderNotFound();
  }

  // ---------- Theme + mobile menu ----------
  function initTheme() {
    const saved = localStorage.getItem(KEYS.THEME);
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    const theme = saved || (prefersLight ? "light" : "dark");
    document.documentElement.dataset.theme = theme;
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const btn = $("#themeToggle");
    if (!btn) return;
    const theme = document.documentElement.dataset.theme || "dark";
    btn.textContent = theme === "light" ? "☼" : "☾";
    btn.title = theme === "light" ? "Switch to dark" : "Switch to light";
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme || "dark";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(KEYS.THEME, next);
    updateThemeIcon();
  }

  function initMobileNav() {
    const burger = $("#hamburger");
    const panel = $("#mobileNav");
    if (!burger || !panel) return;

    burger.addEventListener("click", () => {
      const open = !panel.hasAttribute("hidden");
      if (open) {
        panel.setAttribute("hidden", "");
        burger.setAttribute("aria-expanded", "false");
      } else {
        panel.removeAttribute("hidden");
        burger.setAttribute("aria-expanded", "true");
      }
    });

    // Close panel after navigation
    panel.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      const btn = e.target.closest("button");
      if (a) {
        panel.setAttribute("hidden", "");
        burger.setAttribute("aria-expanded", "false");
      }
      if (btn && btn.id === "mobileLogoutBtn") {
        panel.setAttribute("hidden", "");
        burger.setAttribute("aria-expanded", "false");
        logout();
      }
    });
  }

  // ---------- Init ----------
  async function init() {
    initTheme();
    initMobileNav();

    $("#themeToggle")?.addEventListener("click", toggleTheme);
    $("#mobileLogoutBtn")?.addEventListener("click", logout);

    // reset idle on interactions
    const touch = () => touchSession();
    ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach(evt => {
      window.addEventListener(evt, touch, { passive: true });
    });

    await seedIfNeeded();
    loadAll();

    // Ensure session user still exists & not disabled
    if (state.session?.email) {
      const u = getUserByEmail(state.session.email);
      if (!u || u.disabled) {
        state.session = null;
        saveSession();
      } else {
        // Keep name/role synced in case changed
        state.session.name = u.name;
        state.session.role = u.role;
        saveSession();
      }
    }

    window.addEventListener("hashchange", route);

    // default route
    if (!location.hash) location.hash = "#/products";
    route();
  }

  init().catch(err => {
    console.error(err);
    renderNotice("App error", "Something went wrong initializing the demo app. Try refreshing.", "danger",
      `<a class="btn btn-ghost" href="#/products">Home</a>`);
  });

})();
