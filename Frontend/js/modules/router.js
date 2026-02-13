(function () {
  let currentRoute = "/";

  const routes = {
    "/": { page: "landing", public: true },
    "/login": { page: "login", public: true },
    "/register": { page: "register", public: true },
    "/dashboard": { page: "dashboard-user", roles: ["User", "Manager", "Admin"] },
    "/bookings": { page: "bookings", roles: ["User", "Manager", "Admin"] },
    "/manager": { page: "dashboard-manager", roles: ["Manager", "Admin"] },
    "/admin": { page: "dashboard-admin", roles: ["Admin"] },
    "/profile": { page: "profile", roles: ["User", "Manager", "Admin"] }
  };

  async function getCurrentUser() {
    return window.authService.getCurrentUser();
  }

  function normalizePath(path) {
    if (!path) return "/";
    const trimmed = path.split("?")[0].split("#")[0];
    return trimmed === "" ? "/" : trimmed;
  }

  function canAccessRoute(route, user) {
    if (!route) return false;
    if (route.public) return true;
    if (!user) return false;
    if (!Array.isArray(route.roles) || route.roles.length === 0) return true;
    return route.roles.some((role) => String(role).toLowerCase() === String(user.role || "").toLowerCase());
  }

  async function loadPage(pageName) {
    const app = document.getElementById("app");
    if (!app) throw new Error("App container #app was not found.");

    const candidates = [`/pages/${pageName}.html`, `./pages/${pageName}.html`];
    let html = null;
    let gotFallbackDocument = false;

    for (const path of candidates) {
      const response = await fetch(path);
      if (!response.ok) continue;
      const text = await response.text();

      // When static server fallback is enabled, missing fragments may return index.html with 200.
      const looksLikeFullDocument = /<html[\s>]/i.test(text) && /<body[\s>]/i.test(text);
      if (looksLikeFullDocument) {
        gotFallbackDocument = true;
        continue;
      }

      html = text;
      break;
    }

    if (!html) {
      if (gotFallbackDocument) {
        throw new Error(`Page fragment not found: ${pageName}.html (server returned index fallback). Run frontend without -s single-page rewrite.`);
      }
      throw new Error(`Page fragment not found: ${pageName}.html`);
    }

    app.innerHTML = html;
  }

  async function initializePage(pageName) {
    if (window.componentService) {
      await window.componentService.loadNavbar();
      await window.componentService.loadSidebar();
      await window.componentService.loadFooter();
      await window.componentService.updateNavbarUser(await getCurrentUser());
    }

    if (window.pageInitializers && typeof window.pageInitializers[pageName] === "function") {
      await window.pageInitializers[pageName]();
    }
  }

  async function navigateTo(path, pushState = true) {
    const normalizedPath = normalizePath(path);
    const route = routes[normalizedPath];
    const user = await getCurrentUser();

    if (!route) {
      await navigateTo("/", pushState);
      return;
    }

    if (!canAccessRoute(route, user)) {
      const redirect = user ? "/" : "/login";
      await navigateTo(redirect, true);
      return;
    }

    await loadPage(route.page);
    await initializePage(route.page);
    currentRoute = normalizedPath;

    if (pushState) {
      history.pushState({}, "", normalizedPath);
    }
  }

  async function handleNavigation(event) {
    const target = event.target.closest("[data-link]");
    if (!target) return;

    event.preventDefault();
    const href = target.getAttribute("href");
    if (!href) return;

    await navigateTo(href);
  }

  async function checkRoute() {
    const path = normalizePath(window.location.pathname);
    const route = routes[path];
    const user = await getCurrentUser();

    if (!route) {
      await navigateTo("/", false);
      return;
    }

    if (!canAccessRoute(route, user)) {
      await navigateTo(user ? "/" : "/login", false);
      return;
    }

    await navigateTo(path, false);
  }

  async function initRouter() {
    window.authService.authorize();

    document.addEventListener("click", async (event) => {
      await handleNavigation(event);
    });

    window.addEventListener("popstate", async () => {
      await checkRoute();
    });

    await checkRoute();
  }

  window.router = {
    get currentRoute() {
      return currentRoute;
    },
    routes,
    navigateTo,
    loadPage,
    handleNavigation,
    checkRoute,
    getCurrentUser,
    initRouter
  };
})();
