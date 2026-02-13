(function () {
  function getApiData(payload) {
    if (payload && typeof payload === "object" && "data" in payload) {
      return payload.data;
    }
    return payload;
  }

  function getApiError(payload, fallback = "Request failed.") {
    if (!payload || typeof payload !== "object") return fallback;
    return payload.error || payload.message || fallback;
  }

  function redirectToLogin() {
    const target = "/login";
    if (window.location.pathname !== target) {
      window.location.href = target;
    }
  }

  function fetchAPI(method, endpoint, data = null) {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json"
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const options = {
      method,
      headers
    };

    if (data !== null) {
      options.body = JSON.stringify(data);
    }

    return fetch(`${API_BASE_URL}${endpoint}`, options).then(async (response) => {
      const contentType = response.headers.get("content-type") || "";
      const hasJson = contentType.includes("application/json");
      const payload = hasJson ? await response.json() : null;

      if (!response.ok) {
        if (response.status === 401) {
          removeToken();
          removeUser();
          redirectToLogin();
        }
        throw new Error(getApiError(payload, `HTTP ${response.status}`));
      }

      return payload;
    });
  }

  function register(email, password, confirmPassword, firstName, lastName) {
    return fetchAPI("POST", "/auth/register", {
      email,
      password,
      confirmPassword,
      firstName,
      lastName
    }).then(getApiData);
  }

  function login(email, password) {
    return fetchAPI("POST", "/auth/login", { email, password }).then((payload) => {
      const result = getApiData(payload);
      if (result && result.token) {
        setToken(result.token);
        setUser({
          userId: result.userId,
          email: result.email,
          role: result.role
        });
      }
      return result;
    });
  }

  function getProfile() {
    return fetchAPI("GET", "/users/profile").then(getApiData);
  }

  function getBookings() {
    return fetchAPI("GET", "/bookings").then(getApiData);
  }

  function createBooking(studioId, bookingDate, startTime, endTime) {
    return fetchAPI("POST", "/bookings", {
      studioId,
      bookingDate,
      startTime,
      endTime
    }).then(getApiData);
  }

  function cancelBooking(bookingId) {
    return fetchAPI("DELETE", `/bookings/${bookingId}`);
  }

  function updateBookingStatus(bookingId, status) {
    return fetchAPI("PUT", `/bookings/${bookingId}`, { status }).then(getApiData);
  }

  function getStudios() {
    return fetchAPI("GET", "/studios").then(getApiData);
  }

  function getAllUsers() {
    return fetchAPI("GET", "/users").then(getApiData);
  }

  function deleteUser(userId) {
    return fetchAPI("DELETE", `/users/${userId}`);
  }

  window.apiService = {
    fetchAPI,
    register,
    login,
    getProfile,
    getBookings,
    createBooking,
    cancelBooking,
    updateBookingStatus,
    getStudios,
    getAllUsers,
    deleteUser
  };
})();
