//Logout Functionality
function setupNavbar() {
  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const logoutLink = document.getElementById("logoutLink");
  const adminLink = document.getElementById("adminLink");

  fetch("http://localhost:3000/api/auth/profile", {
    credentials: "include"
  })
    .then(res => {
      if (!res.ok) throw new Error("Not logged in");
      return res.json();
    })
    .then(data => {
      console.log("Logged in user:", data);

      // Show logout and hide login/register
      if (loginLink) loginLink.style.display = "none";
      if (registerLink) registerLink.style.display = "none";
      if (logoutLink) logoutLink.style.display = "inline";

      // Show admin button only if user is admin
      if (adminLink) {
        if (data.user.role === "admin") {
          adminLink.style.display = "inline";
        } else {
          adminLink.style.display = "none";
        }
      }

      if (logoutLink) {
        logoutLink.addEventListener("click", async (e) => {
          e.preventDefault();

          await fetch("http://localhost:3000/api/auth/logout", {
            method: "POST",
            credentials: "include"
          });

          alert("Logged out");
          window.location.href = "index.html";
        });
      }
    })

    // Shows login and register buttons plus hides logout and admin by default
    .catch(() => {
      console.log("User not logged in");

      if (loginLink) loginLink.style.display = "inline";
      if (registerLink) registerLink.style.display = "inline";
      if (logoutLink) logoutLink.style.display = "none";
      if (adminLink) adminLink.style.display = "none";
    });
}
