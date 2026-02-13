(function () {
  let currentUser = null;

  function normalizeRole(role) {
    if (role === 0 || role === "0") return "User";
    if (role === 1 || role === "1") return "Manager";
    if (role === 2 || role === "2") return "Admin";
    return role || "";
  }

  function normalizeUser(user) {
    if (!user) return null;
    return {
      ...user,
      role: normalizeRole(user.role)
    };
  }

  function authorize() {
    currentUser = normalizeUser(getUser());
    if (currentUser) setUser(currentUser);
    return currentUser;
  }

  function login(email, password) {
    return window.apiService.login(email, password).then((result) => {
      currentUser = getUser();
      return result;
    });
  }

  function logout() {
    if (window.app && typeof window.app.logout === "function") {
      window.app.logout();
      return;
    }
    removeToken();
    removeUser();
    currentUser = null;
    window.location.href = "/";
  }

  function register(data) {
    return window.apiService.register(
      data.email,
      data.password,
      data.confirmPassword,
      data.firstName,
      data.lastName
    );
  }

  function getCurrentUser() {
    if (!currentUser) {
      currentUser = normalizeUser(getUser());
      if (currentUser) setUser(currentUser);
    }
    return currentUser;
  }

  function getTokenValue() {
    return getToken();
  }

  function isAuthenticated() {
    return !!getToken();
  }

  function hasRole(role) {
    const user = getCurrentUser();
    if (!user || !user.role) return false;
    return String(normalizeRole(user.role)).toLowerCase() === String(normalizeRole(role)).toLowerCase();
  }

  function canAccess(requiredRole) {
    if (!requiredRole) return isAuthenticated();

    const user = getCurrentUser();
    if (!user || !user.role) return false;

    const rolePriority = {
      user: 1,
      manager: 2,
      admin: 3
    };

    const current = rolePriority[String(normalizeRole(user.role)).toLowerCase()] || 0;
    const required = rolePriority[String(normalizeRole(requiredRole)).toLowerCase()] || 0;

    return current >= required && required > 0;
  }

  window.authService = {
    authorize,
    login,
    logout,
    register,
    getCurrentUser,
    getToken: getTokenValue,
    isAuthenticated,
    hasRole,
    canAccess
  };
})();
