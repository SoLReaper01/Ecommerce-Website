console.log("Main site loaded");

const page = window.location.pathname;
console.log("Current page:", page);

if (page.includes("register.html")) {
  initRegister();
}

if (page.includes("login.html")) {
  initLogin();
}

// Always run navbar logic
setupNavbar();