(function () {
  function toStatusText(status) {
    const value = String(status).toLowerCase();
    if (value === "0" || value === "pending") return "Pending";
    if (value === "1" || value === "confirmed") return "Confirmed";
    if (value === "2" || value === "cancelled") return "Cancelled";
    return String(status);
  }

  function statusBadgeClass(status) {
    const s = toStatusText(status).toLowerCase();
    if (s === "pending") return "bg-amber-500/15 text-amber-300 border border-amber-500/40";
    if (s === "confirmed") return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40";
    return "bg-rose-500/15 text-rose-300 border border-rose-500/40";
  }

  function setLoading(button, on, idleText, loadingText) {
    if (!button) return;
    button.disabled = on;
    button.textContent = on ? loadingText : idleText;
    button.classList.toggle("opacity-60", on);
    button.classList.toggle("cursor-not-allowed", on);
  }

  async function initLoginPage() {
    const form = document.getElementById("loginForm") || document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("login-email")?.value?.trim() || "";
      const password = document.getElementById("login-password")?.value || "";
      const submit = document.getElementById("login-submit");

      if (!email || !email.includes("@")) {
        showNotification("Введите корректный email.", "error");
        return;
      }
      if (!password || password.length < 6) {
        showNotification("Пароль должен быть минимум 6 символов.", "error");
        return;
      }

      try {
        setLoading(submit, true, "Sign in", "Signing in...");
        await window.authService.login(email, password);
        await window.router.navigateTo("/dashboard");
      } catch (error) {
        const msg = (error?.message || "").toLowerCase();
        if (msg.includes("invalid") || msg.includes("401")) {
          showNotification("Неверный пароль или email", "error");
        } else {
          showNotification(error.message || "Ошибка входа", "error");
        }
      } finally {
        setLoading(submit, false, "Sign in", "Signing in...");
      }
    });
  }

  async function initRegisterPage() {
    const form = document.getElementById("registerForm") || document.getElementById("register-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const firstName = document.getElementById("reg-first-name")?.value?.trim() || "";
      const lastName = document.getElementById("reg-last-name")?.value?.trim() || "";
      const email = document.getElementById("reg-email")?.value?.trim() || "";
      const password = document.getElementById("reg-password")?.value || "";
      const confirmPassword = document.getElementById("reg-confirm-password")?.value || "";
      const submit = document.getElementById("register-submit");

      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        showNotification("Заполни все поля.", "error");
        return;
      }
      if (!email.includes("@")) {
        showNotification("Введите корректный email.", "error");
        return;
      }
      if (password.length < 6) {
        showNotification("Пароль должен быть минимум 6 символов.", "error");
        return;
      }
      if (password !== confirmPassword) {
        showNotification("Пароли не совпадают.", "error");
        return;
      }

      try {
        setLoading(submit, true, "Create account", "Creating...");
        await window.authService.register({ firstName, lastName, email, password, confirmPassword });
        showNotification("Регистрация успешна. Войди в аккаунт.", "success");
        await window.router.navigateTo("/login");
      } catch (error) {
        showNotification(error.message || "Ошибка регистрации", "error");
      } finally {
        setLoading(submit, false, "Create account", "Creating...");
      }
    });
  }

  async function initUserDashboardPage() {
    const bookingsBody = document.getElementById("user-bookings-body");
    const empty = document.getElementById("user-bookings-empty");
    const loading = document.getElementById("user-dashboard-loading");
    const filterStatus = document.getElementById("filter-status");
    const filterDate = document.getElementById("filter-date");
    const form = document.getElementById("new-booking-form");
    const openModalBtn = document.getElementById("open-booking-modal");
    const closeModalBtn = document.getElementById("close-booking-modal");
    const modal = document.getElementById("booking-modal");

    const studioSelect = document.getElementById("booking-studio");
    const bookingDate = document.getElementById("booking-date");
    const bookingStart = document.getElementById("booking-start");
    const bookingEnd = document.getElementById("booking-end");
    const bookingPrice = document.getElementById("booking-price");
    const submit = document.getElementById("booking-submit");

    let studios = [];
    let bookings = [];

    async function loadStudios() {
      studios = (await window.apiService.getStudios()) || [];
      studioSelect.innerHTML = '<option value="">Select studio</option>';
      studios.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = String(s.id);
        opt.textContent = `${s.name} ($${Number(s.hourlyRate || 0).toFixed(2)}/h)`;
        studioSelect.appendChild(opt);
      });
    }

    function renderBookings(list) {
      bookingsBody.innerHTML = "";
      const status = filterStatus?.value || "all";
      const date = filterDate?.value || "";

      const filtered = list.filter((b) => {
        const st = toStatusText(b.status).toLowerCase();
        const okS = status === "all" || status === st;
        const okD = !date || String(b.bookingDate).startsWith(date);
        return okS && okD;
      });

      empty.classList.toggle("hidden", filtered.length > 0);
      filtered.forEach((b) => {
        const studio = studios.find((s) => s.id === b.studioId);
        const tr = document.createElement("tr");
        const statusText = toStatusText(b.status);
        const canCancel = statusText === "Pending" || statusText === "Confirmed";

        tr.className = "border-b border-slate-800";
        tr.innerHTML = `
          <td class="px-3 py-3">${studio?.name || `Studio #${b.studioId}`}</td>
          <td class="px-3 py-3">${formatDate(b.bookingDate)}</td>
          <td class="px-3 py-3">${formatTime(b.startTime)} - ${formatTime(b.endTime)}</td>
          <td class="px-3 py-3"><span class="rounded-full px-2 py-1 text-xs ${statusBadgeClass(b.status)}">${statusText}</span></td>
          <td class="px-3 py-3">$${Number(b.totalPrice || 0).toFixed(2)}</td>
          <td class="px-3 py-3">${canCancel ? `<button data-cancel="${b.id}" class="rounded bg-rose-500 px-3 py-1 text-xs text-white">Cancel</button>` : ""}</td>
        `;
        bookingsBody.appendChild(tr);
      });

      bookingsBody.querySelectorAll("[data-cancel]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await handleCancelBooking(Number(btn.getAttribute("data-cancel")));
        });
      });
    }

    async function loadUserBookings() {
      loading.classList.remove("hidden");
      try {
        bookings = (await window.apiService.getBookings()) || [];
        renderBookings(bookings);
      } catch (error) {
        showNotification(error.message || "Ошибка загрузки бронирований", "error");
      } finally {
        loading.classList.add("hidden");
      }
    }

    async function handleCancelBooking(bookingId) {
      if (!confirm("Cancel this booking?")) return;
      try {
        await window.apiService.cancelBooking(bookingId);
        showNotification("Booking cancelled", "success");
        await loadUserBookings();
      } catch (error) {
        showNotification(error.message || "Не удалось отменить бронирование", "error");
      }
    }

    async function openBookingModal() {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }

    async function closeBookingModal() {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }

    function recalcPrice() {
      const studioId = Number(studioSelect.value);
      const studio = studios.find((s) => s.id === studioId);
      const start = getTimeFromString(bookingStart.value);
      const end = getTimeFromString(bookingEnd.value);
      if (!studio || !start || !end) {
        bookingPrice.textContent = "$0.00";
        return;
      }
      const hs = start.hours + start.minutes / 60;
      const he = end.hours + end.minutes / 60;
      const price = calculatePrice(Math.max(0, he - hs), Number(studio.hourlyRate || 0));
      bookingPrice.textContent = `$${price.toFixed(2)}`;
    }

    async function handleCreateBooking(event) {
      event.preventDefault();
      const studioId = Number(studioSelect.value);
      const date = bookingDate.value;
      const start = bookingStart.value;
      const end = bookingEnd.value;

      if (!studioId || !date || !start || !end) {
        showNotification("Fill all booking fields.", "error");
        return;
      }
      if (end <= start) {
        showNotification("End time must be greater than start time.", "error");
        return;
      }

      try {
        setLoading(submit, true, "Book now", "Booking...");
        await window.apiService.createBooking(studioId, date, start, end);
        showNotification("Booking created", "success");
        form.reset();
        bookingPrice.textContent = "$0.00";
        await closeBookingModal();
        await loadUserBookings();
      } catch (error) {
        showNotification(error.message || "Не удалось создать бронирование", "error");
      } finally {
        setLoading(submit, false, "Book now", "Booking...");
      }
    }

    openModalBtn?.addEventListener("click", openBookingModal);
    closeModalBtn?.addEventListener("click", closeBookingModal);
    studioSelect?.addEventListener("change", recalcPrice);
    bookingStart?.addEventListener("input", recalcPrice);
    bookingEnd?.addEventListener("input", recalcPrice);
    filterStatus?.addEventListener("change", () => renderBookings(bookings));
    filterDate?.addEventListener("change", () => renderBookings(bookings));
    form?.addEventListener("submit", handleCreateBooking);

    await loadStudios();
    await loadUserBookings();

    window.dashboardUserHandlers = {
      loadUserBookings,
      renderBookings,
      handleCancelBooking,
      openBookingModal,
      handleCreateBooking
    };
  }

  async function initManagerDashboardPage() {
    const loading = document.getElementById("manager-loading");
    const statToday = document.getElementById("manager-stat-today");
    const statRevenue = document.getElementById("manager-stat-revenue");
    const statCapacity = document.getElementById("manager-stat-capacity");
    const tableBody = document.getElementById("manager-bookings-body");
    const chart = document.getElementById("manager-chart");

    let bookings = [];
    let studios = [];

    async function loadManagerBookings() {
      bookings = (await window.apiService.getBookings()) || [];
      studios = (await window.apiService.getStudios()) || [];

      tableBody.innerHTML = "";
      bookings.forEach((b) => {
        const studio = studios.find((s) => s.id === b.studioId);
        const pending = toStatusText(b.status) === "Pending";
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-800";
        tr.innerHTML = `
          <td class="px-3 py-3">${formatDate(b.bookingDate)}</td>
          <td class="px-3 py-3">${studio?.name || `Studio #${b.studioId}`}</td>
          <td class="px-3 py-3">${formatTime(b.startTime)} - ${formatTime(b.endTime)}</td>
          <td class="px-3 py-3"><span class="rounded-full px-2 py-1 text-xs ${statusBadgeClass(b.status)}">${toStatusText(b.status)}</span></td>
          <td class="px-3 py-3">${pending ? `<button data-confirm="${b.id}" class="rounded bg-emerald-500 px-3 py-1 text-xs text-white">Confirm</button>` : ""}</td>
        `;
        tableBody.appendChild(tr);
      });

      tableBody.querySelectorAll("[data-confirm]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await handleConfirmBooking(Number(btn.getAttribute("data-confirm")));
        });
      });
    }

    async function handleConfirmBooking(bookingId) {
      try {
        await window.apiService.updateBookingStatus(bookingId, 1);
        showNotification("Booking confirmed", "success");
        await loadStats();
        await loadManagerBookings();
        await updateChart();
      } catch (error) {
        showNotification(error.message || "Не удалось подтвердить", "error");
      }
    }

    async function loadStats() {
      const today = new Date().toISOString().slice(0, 10);
      const month = new Date().toISOString().slice(0, 7);
      const todays = bookings.filter((b) => String(b.bookingDate).startsWith(today));
      const monthly = bookings.filter((b) => String(b.bookingDate).startsWith(month));
      const monthRev = monthly.reduce((s, b) => s + Number(b.totalPrice || 0), 0);

      const capTotal = studios.reduce((s, x) => s + Number(x.maxCapacity || 0), 0);
      const capUsed = Math.min(100, Math.round((todays.length / Math.max(1, capTotal)) * 100));

      statToday.textContent = String(todays.length);
      statRevenue.textContent = `$${monthRev.toFixed(2)}`;
      statCapacity.textContent = `${capUsed}%`;
    }

    async function updateChart() {
      const byDay = {};
      bookings.forEach((b) => {
        const day = String(b.bookingDate).slice(8, 10);
        byDay[day] = (byDay[day] || 0) + Number(b.totalPrice || 0);
      });

      const items = Object.entries(byDay)
        .sort(([a], [b]) => Number(a) - Number(b))
        .slice(-10)
        .map(([d, t]) => `<div class="flex flex-col items-center gap-1"><div class="w-6 rounded-t bg-sky-400" style="height:${Math.max(8, Math.min(130, Number(t)))}px"></div><span class="text-xs text-slate-400">${d}</span></div>`)
        .join("");

      chart.innerHTML = items || '<p class="text-sm text-slate-400">No chart data.</p>';
    }

    try {
      loading.classList.remove("hidden");
      await loadManagerBookings();
      await loadStats();
      await updateChart();
    } catch (error) {
      showNotification(error.message || "Ошибка загрузки manager dashboard", "error");
    } finally {
      loading.classList.add("hidden");
    }

    window.managerHandlers = { loadStats, loadManagerBookings, handleConfirmBooking, updateChart };
  }

  async function initAdminDashboardPage() {
    const loading = document.getElementById("admin-loading");
    const statUsers = document.getElementById("admin-stat-users");
    const statBookings = document.getElementById("admin-stat-bookings");
    const statRevenue = document.getElementById("admin-stat-revenue");
    const usersBody = document.getElementById("admin-users-body");
    const roleModal = document.getElementById("role-modal");
    const roleUserId = document.getElementById("role-user-id");
    const roleSelect = document.getElementById("role-select");

    let users = [];
    let bookings = [];

    async function loadAllUsers() {
      users = (await window.apiService.getAllUsers()) || [];
      renderUsers(users);
    }

    function renderUsers(list) {
      usersBody.innerHTML = "";
      list.forEach((u) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-800";
        tr.innerHTML = `
          <td class="px-3 py-3">${u.email}</td>
          <td class="px-3 py-3">${u.firstName || ""} ${u.lastName || ""}</td>
          <td class="px-3 py-3">${u.role}</td>
          <td class="px-3 py-3"><button data-role="${u.id}" class="rounded bg-amber-500 px-3 py-1 text-xs text-amber-950">Change role</button></td>
          <td class="px-3 py-3"><button data-delete="${u.id}" class="rounded bg-rose-500 px-3 py-1 text-xs text-white">Delete</button></td>
        `;
        usersBody.appendChild(tr);
      });

      usersBody.querySelectorAll("[data-delete]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await handleDeleteUser(Number(btn.getAttribute("data-delete")));
        });
      });

      usersBody.querySelectorAll("[data-role]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await openRoleModal(Number(btn.getAttribute("data-role")));
        });
      });
    }

    async function handleDeleteUser(userId) {
      if (!confirm("Delete this user?")) return;
      try {
        await window.apiService.deleteUser(userId);
        showNotification("User deleted", "success");
        await loadAllUsers();
        await loadStats();
      } catch (error) {
        showNotification(error.message || "Не удалось удалить пользователя", "error");
      }
    }

    async function openRoleModal(userId) {
      roleUserId.value = String(userId);
      const user = users.find((x) => x.id === userId);
      roleSelect.value = user?.role || "User";
      roleModal.classList.remove("hidden");
      roleModal.classList.add("flex");
    }

    async function closeRoleModal() {
      roleModal.classList.add("hidden");
      roleModal.classList.remove("flex");
    }

    async function handleChangeRole(userId, newRole) {
      try {
        await window.apiService.updateUserRole(userId, newRole);
        showNotification("Role updated", "success");
      } catch (error) {
        showNotification(error.message || "Role endpoint not available yet", "alert");
      }
      await closeRoleModal();
      await loadAllUsers();
    }

    async function loadStats() {
      bookings = (await window.apiService.getBookings()) || [];
      statUsers.textContent = String(users.length);
      statBookings.textContent = String(bookings.length);
      statRevenue.textContent = `$${bookings.reduce((s, b) => s + Number(b.totalPrice || 0), 0).toFixed(2)}`;
    }

    document.getElementById("role-cancel")?.addEventListener("click", closeRoleModal);
    document.getElementById("role-save")?.addEventListener("click", async () => {
      await handleChangeRole(Number(roleUserId.value), roleSelect.value);
    });

    try {
      loading.classList.remove("hidden");
      await loadAllUsers();
      await loadStats();
    } catch (error) {
      showNotification(error.message || "Ошибка admin dashboard", "error");
    } finally {
      loading.classList.add("hidden");
    }

    window.adminHandlers = { loadAllUsers, renderUsers, handleDeleteUser, openRoleModal, handleChangeRole, loadStats };
  }

  async function initProfilePage() {
    const loading = document.getElementById("profile-loading");
    const email = document.getElementById("profile-email");
    const first = document.getElementById("profile-first-name");
    const last = document.getElementById("profile-last-name");
    const role = document.getElementById("profile-role");
    const history = document.getElementById("profile-booking-history");
    const btnEdit = document.getElementById("profile-edit");
    const btnSave = document.getElementById("profile-save");
    const btnPassword = document.getElementById("profile-password");
    const btnLogout = document.getElementById("profile-logout");

    async function loadProfile() {
      const profile = await window.apiService.getProfile();
      renderProfile(profile);
      const bookings = (await window.apiService.getBookings()) || [];
      const recent = bookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)).slice(0, 5);
      history.innerHTML = recent.length
        ? recent.map((b) => `<li class="rounded border border-slate-700 px-3 py-2 text-sm text-slate-300">${formatDate(b.bookingDate)} • ${formatTime(b.startTime)}-${formatTime(b.endTime)} • ${toStatusText(b.status)}</li>`).join("")
        : '<li class="text-slate-400">No bookings yet.</li>';
    }

    function renderProfile(user) {
      email.textContent = user?.email || "-";
      role.textContent = user?.role || "-";
      first.value = user?.firstName || "";
      last.value = user?.lastName || "";
      first.disabled = true;
      last.disabled = true;
      btnSave.classList.add("hidden");
    }

    async function enableEdit() {
      first.disabled = false;
      last.disabled = false;
      btnSave.classList.remove("hidden");
    }

    async function handleSaveProfile() {
      try {
        await window.apiService.updateProfile({ firstName: first.value.trim(), lastName: last.value.trim() });
        showNotification("Profile saved", "success");
      } catch (error) {
        showNotification(error.message || "Profile update endpoint not available yet", "alert");
      }
      first.disabled = true;
      last.disabled = true;
      btnSave.classList.add("hidden");
    }

    async function handleChangePassword() {
      const currentPassword = prompt("Current password:") || "";
      const newPassword = prompt("New password:") || "";
      const confirmPassword = prompt("Confirm new password:") || "";
      if (!currentPassword || !newPassword || !confirmPassword) return;
      if (newPassword.length < 6 || newPassword !== confirmPassword) {
        showNotification("Password validation failed", "error");
        return;
      }
      try {
        await window.apiService.changePassword(currentPassword, newPassword, confirmPassword);
        showNotification("Password changed", "success");
      } catch (error) {
        showNotification(error.message || "Password endpoint not available yet", "alert");
      }
    }

    try {
      loading.classList.remove("hidden");
      await loadProfile();
    } catch (error) {
      showNotification(error.message || "Ошибка профиля", "error");
    } finally {
      loading.classList.add("hidden");
    }

    btnEdit?.addEventListener("click", enableEdit);
    btnSave?.addEventListener("click", handleSaveProfile);
    btnPassword?.addEventListener("click", handleChangePassword);
    btnLogout?.addEventListener("click", async () => {
      await window.componentService.logout();
    });

    window.profileHandlers = { loadProfile, renderProfile, enableEdit, handleSaveProfile, handleChangePassword };
  }

  window.pageInitializers = {
    landing: async () => {},
    login: initLoginPage,
    register: initRegisterPage,
    "dashboard-user": initUserDashboardPage,
    bookings: async () => {},
    "dashboard-manager": initManagerDashboardPage,
    "dashboard-admin": initAdminDashboardPage,
    profile: initProfilePage
  };
})();
