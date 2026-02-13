(function () {
  let currentUser = null;

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

  async function initApp() {
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
  }

  window.addEventListener("load", initApp);
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
