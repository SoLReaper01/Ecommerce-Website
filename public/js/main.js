console.log("Main site loaded");

document.getElementById("registerForm").addEventListener("submit", async (e) => {
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
  console.log(data);
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  // Save JWT token
  localStorage.setItem("token", data.token);

  console.log("Logged in!");
});

localStorage.setItem("token", data.token);

const token = localStorage.getItem("token");

fetch("http://localhost:3000/api/protected", {
  headers: {
    Authorization: `Bearer ${token}`
  }
});