console.log("Main site loaded");
const page = window.location.pathname;
console.log("Current page:", page);

//Register Form
if (page.includes("register.html")) {
  const registerForm = document.getElementById("registerForm");

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, phone, password })
    });

    const data = await res.json();
    
    if (res.ok) {
        alert("User created");
        form.reset();

    } else {
        alert(data.message || "Registration failed");
    }
    });
}

// Login Form
if (page.includes("login.html")) {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
        console.log("LOGIN SUCCESS HIT");
        alert("Logged in!");
        window.location.href = "index.html";
        
    } else {
        alert(data.message || "Login failed");
    }
    });
}

fetch("http://localhost:3000/api/auth/profile", {
  credentials: "include"
})
  .then(res => res.json())
  .then(data => console.log(data));