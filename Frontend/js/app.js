(function () {
  let currentUser = null;
  let initialized = false;

  function decodeJwtPayload(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  function isTokenValid(token) {
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }

  async function handleNavigation() {
    await window.router.checkRoute();
  }

  async function logout() {
    removeToken();
    removeUser();
    currentUser = null;

    const navbar = document.getElementById("navbar");
    const sidebar = document.getElementById("sidebar");
    if (navbar) navbar.innerHTML = "";
    if (sidebar) sidebar.innerHTML = "";

    await window.router.navigateTo("/");
  }

  function renderStartupError(error) {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = `
      <div class="mx-auto mt-10 w-[min(900px,94%)] rounded-xl border border-rose-500/50 bg-rose-500/10 p-5 text-rose-200">
        <h2 class="text-lg font-bold">Frontend startup error</h2>
        <p class="mt-2 text-sm">${error?.message || "Unknown startup error"}</p>
        <p class="mt-2 text-xs text-rose-300/80">Open DevTools Console for full details.</p>
      </div>
    `;
  }

  async function initApp() {
    if (initialized) return;
    initialized = true;

    try {
    const token = getToken();
    currentUser = window.authService.authorize();

    if (token && !isTokenValid(token)) {
      removeToken();
      removeUser();
      currentUser = null;
    }

    const path = window.location.pathname || "/";
    const hasSession = !!getToken();

    if (path === "/" && hasSession) {
      await window.router.navigateTo("/dashboard", false);
      return;
    }

    if (!hasSession && !window.router.routes[path]?.public) {
      await window.router.navigateTo("/", false);
      return;
    }

      await window.router.checkRoute();

      const app = document.getElementById("app");
      if (app && !app.innerHTML.trim()) {
        await window.router.loadPage("landing");
        if (window.componentService) {
          await window.componentService.loadNavbar();
          await window.componentService.loadSidebar();
          await window.componentService.loadFooter();
          await window.componentService.updateNavbarUser(window.authService.getCurrentUser());
        }
      }
    } catch (error) {
      console.error("initApp failed:", error);
      renderStartupError(error);
    }
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    void initApp();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      void initApp();
    });
  }

  window.addEventListener("load", () => {
    void initApp();
  });
  window.addEventListener("popstate", handleNavigation);

  document.addEventListener("click", async (event) => {
    const link = event.target.closest("[data-link]");
    if (!link) return;
    await window.router.handleNavigation(event);
  });

  window.app = {
    initApp,
    handleNavigation,
    logout,
    getCurrentUser: () => currentUser
  };
})();
