(function () {
  async function fetchTemplate(path) {
    const candidates = [path.startsWith("./") ? `/${path.slice(2)}` : path, path];

    for (const candidate of candidates) {
      const response = await fetch(candidate);
      if (!response.ok) continue;
      const text = await response.text();

      // Guard against SPA fallback returning full index document.
      const looksLikeFullDocument = /<html[\s>]/i.test(text) && /<body[\s>]/i.test(text);
      if (looksLikeFullDocument) continue;

      return text;
    }

    throw new Error(`Template not found: ${path}`);
  }

  function normalizeRole(role) {
    if (role === 0 || role === "0") return "User";
    if (role === 1 || role === "1") return "Manager";
    if (role === 2 || role === "2") return "Admin";
    return role || "Guest";
  }

  function createLink(path, label, activePath, mode = "nav") {
    const active = activePath === path;
    const baseNav = "rounded-lg px-3 py-2 text-sm transition";
    const baseSidebar = "block w-full rounded-lg px-3 py-2.5 text-sm font-medium transition";
    const base = mode === "sidebar" ? baseSidebar : baseNav;

    const cls = active
      ? mode === "sidebar"
        ? `${base} border border-rose-300/40 bg-gradient-to-r from-rose-600/25 to-red-600/20 text-rose-100 shadow-[0_8px_18px_rgba(225,29,72,0.26)]`
        : `${base} bg-rose-500/20 text-rose-200`
      : mode === "sidebar"
        ? `${base} border border-slate-700/60 text-slate-200 hover:border-rose-400/45 hover:bg-slate-800/80 hover:text-white`
        : `${base} text-slate-200 hover:bg-slate-800 hover:text-white`;
    return `<a href="${path}" data-link class="${cls}">${label}</a>`;
  }

  function getNavbarLinks(user) {
    if (!user) {
      return [
        { path: "/", label: "Home" },
        { path: "/login", label: "Login" },
        { path: "/register", label: "Register" }
      ];
    }

    const role = normalizeRole(user.role).toLowerCase();
    if (role === "admin") {
      return [
        { path: "/admin", label: "Admin Panel" },
        { path: "/admin", label: "Users" },
        { path: "/admin", label: "Statistics" }
      ];
    }
    if (role === "manager") {
      return [
        { path: "/manager", label: "Dashboard" },
        { path: "/bookings", label: "Bookings" }
      ];
    }
    return [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/bookings", label: "My Bookings" }
    ];
  }

  async function loadNavbar() {
    const container = document.getElementById("navbar");
    if (!container) return;

    const user = window.authService.getCurrentUser();
    container.innerHTML = await fetchTemplate("./components/navbar.html");

    const activePath = window.location.pathname || "/";
    const links = getNavbarLinks(user);
    const desktop = document.getElementById("navbar-desktop-links");
    const mobile = document.getElementById("navbar-mobile-links");
    const userPanel = document.getElementById("navbar-user-panel");
    const profileBtn = document.getElementById("navbar-profile-btn");
    const profileDropdown = document.getElementById("navbar-profile-dropdown");
    const burger = document.getElementById("navbar-burger");

    if (desktop) {
      desktop.innerHTML = links.map((x) => createLink(x.path, x.label, activePath)).join("");
      if (user) {
        desktop.insertAdjacentHTML("beforeend", createLink("/profile", "Profile", activePath));
        desktop.insertAdjacentHTML(
          "beforeend",
          '<button id="navbar-logout-inline" type="button" class="rounded-lg bg-rose-600 px-3 py-2 text-sm text-white shadow-[0_8px_18px_rgba(190,24,93,0.3)]">Logout</button>'
        );
      }
    }

    if (mobile) {
      const mobileLinks = [...links];
      if (user) mobileLinks.push({ path: "/profile", label: "Profile" });
      mobile.innerHTML = mobileLinks.map((x) => createLink(x.path, x.label, activePath)).join("");
      if (user) {
        mobile.insertAdjacentHTML(
          "beforeend",
          '<button id="navbar-logout-mobile" type="button" class="w-full rounded-lg bg-rose-600 px-3 py-2 text-left text-sm text-white shadow-[0_8px_18px_rgba(190,24,93,0.3)]">Logout</button>'
        );
      }
    }

    const nameEl = document.getElementById("navbar-user-name");
    const emailEl = document.getElementById("navbar-user-email");
    if (userPanel) userPanel.classList.toggle("hidden", !user);
    if (nameEl) nameEl.textContent = user?.firstName || normalizeRole(user?.role) || "Guest";
    if (emailEl) emailEl.textContent = user?.email || "Not logged in";

    const inlineLogout = document.getElementById("navbar-logout-inline");
    const dropdownLogout = document.getElementById("navbar-logout-btn");
    const mobileLogout = document.getElementById("navbar-logout-mobile");

    [inlineLogout, dropdownLogout, mobileLogout].forEach((btn) => {
      btn?.addEventListener("click", async () => {
        await logout();
      });
    });

    profileBtn?.addEventListener("click", () => {
      profileDropdown?.classList.toggle("hidden");
    });

    burger?.addEventListener("click", () => {
      mobile?.classList.toggle("hidden");
    });
  }

  async function loadSidebar() {
    const container = document.getElementById("sidebar");
    if (!container) return;

    const user = window.authService.getCurrentUser();
    container.innerHTML = await fetchTemplate("./components/sidebar.html");

    const role = normalizeRole(user?.role).toLowerCase();
    const activePath = window.location.pathname || "/";
    const linksContainer = document.getElementById("sidebar-links");
    const toggle = document.getElementById("sidebar-toggle");

    const items = [
      { path: "/dashboard", label: "Dashboard", visible: !!user },
      { path: "/bookings", label: "Bookings", visible: !!user },
      { path: "/profile", label: "Profile", visible: !!user },
      { path: "/manager", label: "Manager", visible: role === "manager" || role === "admin" },
      { path: "/admin", label: "Admin", visible: role === "admin" }
    ].filter((x) => x.visible);

    if (linksContainer) {
      linksContainer.innerHTML = items.map((x) => createLink(x.path, x.label, activePath, "sidebar")).join("");
    }

    toggle?.addEventListener("click", () => {
      linksContainer?.classList.toggle("hidden");
    });
  }

  async function loadFooter() {
    const existing = document.getElementById("footer");
    if (existing) {
      existing.innerHTML = await fetchTemplate("./components/footer.html");
      return;
    }

    const app = document.getElementById("app");
    if (!app) return;
    const footerHost = document.createElement("div");
    footerHost.id = "footer";
    footerHost.innerHTML = await fetchTemplate("./components/footer.html");
    app.insertAdjacentElement("afterend", footerHost);
  }

  async function updateNavbarUser(user) {
    const nameEl = document.getElementById("navbar-user-name");
    const emailEl = document.getElementById("navbar-user-email");
    if (nameEl) nameEl.textContent = user?.firstName || normalizeRole(user?.role) || "Guest";
    if (emailEl) emailEl.textContent = user?.email || "Not logged in";
  }

  async function logout() {
    window.authService.logout();
  }

  window.componentService = {
    loadNavbar,
    loadSidebar,
    loadFooter,
    updateNavbarUser,
    logout
  };
})();
