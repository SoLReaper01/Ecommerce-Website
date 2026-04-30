console.log("Main site loaded");

const page = window.location.pathname;
console.log("Current page:", page);

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