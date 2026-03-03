# Team 4 Apparel — E‑commerce Website (Front‑End Prototype)

This folder contains a working **HTML/CSS/JavaScript** demo site for an apparel e‑commerce store.

It implements the key features described in your customer specs and presentation:
- Product catalog browsing + search + category filtering
- Detailed product pages (images, price, description, variant selection)
- User accounts (register/login) + profile
- Shopping cart (add/remove items, update quantities, auto-updating totals)
- Step-by-step checkout (shipping → payment → confirmation)
- Order confirmation + order history
- Store owner/admin tools (role-based access for employee/management/admin)
- Responsive design for desktop and mobile

> **Note:** This is a **front-end only** prototype using `localStorage` (no backend, no real payments).

---

## How to run

Because the site uses client-side routing and modern browser APIs, run it from a local server:

### Option A — Python (recommended)
1. Open a terminal in this folder
2. Run:

```bash
python -m http.server 8000
```

3. Visit: `http://localhost:8000`

### Option B — VS Code Live Server
Open the folder in VS Code → right click `index.html` → “Open with Live Server”.

---

## Demo accounts (role-based access)

Use these to test the admin panel:

- **Admin:** `admin@team4.local` / `Admin123!`
- **Management:** `manager@team4.local` / `Manager123!`
- **Employee:** `employee@team4.local` / `Employee123!`
- **Customer:** `customer@team4.local` / `Customer123!`

---

## Admin panel (RBAC)

Open **Admin tools** from the header (or go to `#/admin`) when logged in.

- **Employee:** view products, orders, customer requests
- **Management:** employee permissions + edit products and update order statuses
- **Admin:** management permissions + user management + audit log

---

## Resetting the demo

If you want to reset all demo data:
- Open DevTools → Application → Storage → **Local Storage**
- Clear entries for this site (or just clear localStorage)

The app will reseed default products and demo users on next load.

---

## Security disclaimer (important)

This prototype demonstrates:
- session expiry after inactivity
- role-based access control
- password hashing via SHA‑256 (demo)

A production e-commerce site must use a backend, salted password hashing (bcrypt/argon2), HTTPS, server-side authorization checks, PCI-compliant payment gateway integration, logging/monitoring, and privacy compliance.
