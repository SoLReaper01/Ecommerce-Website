// Main JavaScript file to initialize page-specific logic

const page = window.location.pathname;

if (page.includes("register.html")) {
  initRegister();
}

if (page.includes("login.html")) {
  initLogin();
}


// Always run navbar logic
setupNavbar();