// Main JavaScript file to initialize page-specific logic

const page = window.location.pathname;

if (page.includes("register.html")) {
  initRegister();
}

if (page.includes("login.html")) {
  initLogin();
}

if (page.includes("admin.html")) {
  initAdmin();
}

// Always run navbar logic
setupNavbar();