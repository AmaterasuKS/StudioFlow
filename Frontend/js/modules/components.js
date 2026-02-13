(function () {
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function loadNavbar() {
    const container = document.getElementById("navbar");
    if (!container) return;

    const user = window.authService.getCurrentUser();
    const role = user?.role || "Guest";

    const navLinks = [];
    navLinks.push('<a href="/" data-link class="text-slate-200 hover:text-white">Home</a>');

    if (!user) {
      navLinks.push('<a href="/login" data-link class="text-slate-200 hover:text-white">Login</a>');
      navLinks.push('<a href="/register" data-link class="text-slate-200 hover:text-white">Register</a>');
    } else {
      navLinks.push('<a href="/dashboard" data-link class="text-slate-200 hover:text-white">Dashboard</a>');
      navLinks.push('<a href="/bookings" data-link class="text-slate-200 hover:text-white">Bookings</a>');
      navLinks.push('<a href="/profile" data-link class="text-slate-200 hover:text-white">Profile</a>');

      if (String(role).toLowerCase() === "manager" || String(role).toLowerCase() === "admin") {
        navLinks.push('<a href="/manager" data-link class="text-slate-200 hover:text-white">Manager</a>');
      }
      if (String(role).toLowerCase() === "admin") {
        navLinks.push('<a href="/admin" data-link class="text-slate-200 hover:text-white">Admin</a>');
      }
    }

    container.innerHTML = `
      <header class="sf-card sticky top-0 mx-auto mt-4 flex w-[min(1100px,96%)] items-center justify-between px-4 py-3">
        <div class="font-bold tracking-wide text-sky-300">StudioFlow</div>
        <nav class="flex items-center gap-4 text-sm">
          ${navLinks.join("")}
        </nav>
        <div class="flex items-center gap-3">
          <span id="navbar-user" class="text-xs text-slate-400">${user ? escapeHtml(user.email) : "Guest"}</span>
          ${user ? '<button id="logout-btn" type="button">Logout</button>' : ""}
        </div>
      </header>
    `;

    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
      logoutButton.addEventListener("click", async () => {
        await logout();
      });
    }
  }

  async function loadSidebar() {
    const container = document.getElementById("sidebar");
    if (!container) return;

    const user = window.authService.getCurrentUser();
    const role = String(user?.role || "").toLowerCase();

    const items = [
      { path: "/dashboard", label: "Dashboard", visible: !!user },
      { path: "/bookings", label: "Bookings", visible: !!user },
      { path: "/profile", label: "Profile", visible: !!user },
      { path: "/manager", label: "Manager Panel", visible: role === "manager" || role === "admin" },
      { path: "/admin", label: "Admin Panel", visible: role === "admin" }
    ]
      .filter((x) => x.visible)
      .map((x) => `<a href="${x.path}" data-link class="block rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">${x.label}</a>`)
      .join("");

    container.innerHTML = `
      <aside class="sf-card p-3">
        <p class="mb-2 text-xs uppercase tracking-wide text-slate-500">Navigation</p>
        <div class="space-y-1">${items}</div>
      </aside>
    `;
  }

  async function updateNavbarUser(user) {
    const element = document.getElementById("navbar-user");
    if (!element) return;
    element.textContent = user?.email || "Guest";
  }

  async function logout() {
    window.authService.logout();
  }

  window.componentService = {
    loadNavbar,
    loadSidebar,
    updateNavbarUser,
    logout
  };
})();
