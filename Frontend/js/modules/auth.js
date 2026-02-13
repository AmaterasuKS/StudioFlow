(function () {
  let currentUser = null;

  function authorize() {
    currentUser = getUser();
    return currentUser;
  }

  function login(email, password) {
    return window.apiService.login(email, password).then((result) => {
      currentUser = getUser();
      return result;
    });
  }

  function logout() {
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
      currentUser = getUser();
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
    return String(user.role).toLowerCase() === String(role).toLowerCase();
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

    const current = rolePriority[String(user.role).toLowerCase()] || 0;
    const required = rolePriority[String(requiredRole).toLowerCase()] || 0;

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
