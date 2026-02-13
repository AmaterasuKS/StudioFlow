(function () {
  async function fetchTemplate(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Template not found: ${path}`);
    return response.text();
  }

  function normalizeRole(role) {
    if (role === 0 || role === "0") return "User";
    if (role === 1 || role === "1") return "Manager";
    if (role === 2 || role === "2") return "Admin";
    return role || "Guest";
  }

  function createLink(path, label, activePath) {
    const active = activePath === path;
    const base = "rounded-lg px-3 py-2 text-sm transition";
    const cls = active
      ? `${base} bg-sky-500/20 text-sky-300`
      : `${base} text-slate-200 hover:bg-slate-800 hover:text-white`;
    return `<a href="${path}" data-link class="${cls}">${label}</a>`;
  }

  function getNavbarLinks(user) {
    if (!user) {
      return [
        { path: "/", label: "Главная" },
        { path: "/login", label: "Вход" },
        { path: "/register", label: "Регистрация" }
      ];
    }

    const role = normalizeRole(user.role).toLowerCase();
    if (role === "admin") {
      return [
        { path: "/admin", label: "Панель" },
        { path: "/admin", label: "Пользователи" },
        { path: "/admin", label: "Статистика" }
      ];
    }
    if (role === "manager") {
      return [
        { path: "/manager", label: "Dashboard" },
        { path: "/bookings", label: "Список бронирований" }
      ];
    }
    return [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/bookings", label: "Мои бронирования" }
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
        desktop.insertAdjacentHTML("beforeend", createLink("/profile", "Профиль", activePath));
        desktop.insertAdjacentHTML(
          "beforeend",
          '<button id="navbar-logout-inline" type="button" class="rounded-lg bg-rose-500 px-3 py-2 text-sm text-white">Выход</button>'
        );
      }
    }

    if (mobile) {
      const mobileLinks = [...links];
      if (user) mobileLinks.push({ path: "/profile", label: "Профиль" });
      mobile.innerHTML = mobileLinks.map((x) => createLink(x.path, x.label, activePath)).join("");
      if (user) {
        mobile.insertAdjacentHTML(
          "beforeend",
          '<button id="navbar-logout-mobile" type="button" class="w-full rounded-lg bg-rose-500 px-3 py-2 text-left text-sm text-white">Выход</button>'
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
    }
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
      { path: "/bookings", label: "Бронирования", visible: !!user },
      { path: "/profile", label: "Профиль", visible: !!user },
      { path: "/manager", label: "Manager", visible: role === "manager" || role === "admin" },
      { path: "/admin", label: "Admin", visible: role === "admin" }
    ].filter((x) => x.visible);

    if (linksContainer) {
      linksContainer.innerHTML = items.map((x) => createLink(x.path, x.label, activePath)).join("");
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
