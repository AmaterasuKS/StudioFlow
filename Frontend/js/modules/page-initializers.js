(function () {
  function parseRole(role) {
    return String(role || "").toLowerCase();
  }

  function statusToLabel(status) {
    const value = String(status);
    if (value === "0" || value.toLowerCase() === "pending") return "Pending";
    if (value === "1" || value.toLowerCase() === "confirmed") return "Confirmed";
    if (value === "2" || value.toLowerCase() === "cancelled") return "Cancelled";
    return value;
  }

  function statusToClass(status) {
    const label = statusToLabel(status).toLowerCase();
    if (label === "pending") return "bg-amber-500/15 text-amber-300 border border-amber-500/40";
    if (label === "confirmed") return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40";
    return "bg-rose-500/15 text-rose-300 border border-rose-500/40";
  }

  function setButtonLoading(button, isLoading, textIdle, textLoading) {
    if (!button) return;
    button.disabled = isLoading;
    button.textContent = isLoading ? textLoading : textIdle;
    if (isLoading) {
      button.classList.add("opacity-60", "cursor-not-allowed");
    } else {
      button.classList.remove("opacity-60", "cursor-not-allowed");
    }
  }

  async function initLoginPage() {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("login-email")?.value?.trim() || "";
      const password = document.getElementById("login-password")?.value || "";
      const submit = document.getElementById("login-submit");

      if (!email || !email.includes("@")) {
        showNotification("Please enter a valid email.", "error");
        return;
      }
      if (!password || password.length < 6) {
        showNotification("Password must be at least 6 characters.", "error");
        return;
      }

      try {
        setButtonLoading(submit, true, "Sign in", "Signing in...");
        await window.authService.login(email, password);
        showNotification("Login successful.", "success");
        await window.router.navigateTo("/dashboard");
      } catch (error) {
        showNotification(error.message || "Login failed.", "error");
      } finally {
        setButtonLoading(submit, false, "Sign in", "Signing in...");
      }
    });
  }

  async function initRegisterPage() {
    const form = document.getElementById("register-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const firstName = document.getElementById("reg-first-name")?.value?.trim() || "";
      const lastName = document.getElementById("reg-last-name")?.value?.trim() || "";
      const email = document.getElementById("reg-email")?.value?.trim() || "";
      const password = document.getElementById("reg-password")?.value || "";
      const confirmPassword = document.getElementById("reg-confirm-password")?.value || "";
      const submit = document.getElementById("register-submit");

      if (!email || !email.includes("@")) {
        showNotification("Please enter a valid email.", "error");
        return;
      }
      if (password.length < 6) {
        showNotification("Password must be at least 6 characters.", "error");
        return;
      }
      if (password !== confirmPassword) {
        showNotification("Passwords do not match.", "error");
        return;
      }

      try {
        setButtonLoading(submit, true, "Create account", "Creating...");
        await window.authService.register({
          firstName,
          lastName,
          email,
          password,
          confirmPassword
        });
        showNotification("Registration successful. Please login.", "success");
        await window.router.navigateTo("/login");
      } catch (error) {
        showNotification(error.message || "Registration failed.", "error");
      } finally {
        setButtonLoading(submit, false, "Create account", "Creating...");
      }
    });
  }

  async function initUserDashboardPage() {
    const loader = document.getElementById("user-dashboard-loading");
    const tableBody = document.getElementById("user-bookings-body");
    const emptyState = document.getElementById("user-bookings-empty");
    const form = document.getElementById("new-booking-form");
    const studioSelect = document.getElementById("booking-studio");
    const startInput = document.getElementById("booking-start");
    const endInput = document.getElementById("booking-end");
    const dateInput = document.getElementById("booking-date");
    const priceOutput = document.getElementById("booking-price");
    const filterStatus = document.getElementById("filter-status");
    const filterDate = document.getElementById("filter-date");

    let bookings = [];
    let studios = [];

    const recalcPrice = () => {
      const studioId = Number(studioSelect?.value || 0);
      const studio = studios.find((s) => s.id === studioId);
      if (!studio) {
        priceOutput.textContent = "$0.00";
        return;
      }

      const start = getTimeFromString(startInput?.value || "");
      const end = getTimeFromString(endInput?.value || "");
      if (!start || !end) {
        priceOutput.textContent = "$0.00";
        return;
      }

      const startHours = start.hours + start.minutes / 60;
      const endHours = end.hours + end.minutes / 60;
      const duration = Math.max(0, endHours - startHours);
      const amount = calculatePrice(duration, studio.hourlyRate);
      priceOutput.textContent = `$${amount.toFixed(2)}`;
    };

    const renderBookings = () => {
      const statusFilter = filterStatus?.value || "all";
      const dateFilter = filterDate?.value || "";

      const filtered = bookings.filter((item) => {
        const statusLabel = statusToLabel(item.status).toLowerCase();
        const passesStatus = statusFilter === "all" || statusFilter === statusLabel;
        const passesDate = !dateFilter || String(item.bookingDate).startsWith(dateFilter);
        return passesStatus && passesDate;
      });

      tableBody.innerHTML = "";
      emptyState.classList.toggle("hidden", filtered.length !== 0);

      filtered.forEach((item) => {
        const studio = studios.find((s) => s.id === item.studioId);
        const row = document.createElement("tr");
        row.className = "border-b border-slate-800";
        const canCancel = ["pending", "confirmed"].includes(statusToLabel(item.status).toLowerCase());

        row.innerHTML = `
          <td class="px-3 py-3">${studio?.name || `Studio #${item.studioId}`}</td>
          <td class="px-3 py-3">${formatDate(item.bookingDate)}</td>
          <td class="px-3 py-3">${formatTime(item.startTime)} - ${formatTime(item.endTime)}</td>
          <td class="px-3 py-3">
            <span class="rounded-full px-2 py-1 text-xs ${statusToClass(item.status)}">${statusToLabel(item.status)}</span>
          </td>
          <td class="px-3 py-3">$${Number(item.totalPrice || 0).toFixed(2)}</td>
          <td class="px-3 py-3">
            ${canCancel ? `<button data-cancel-id="${item.id}" class="rounded bg-rose-500/85 px-3 py-1 text-xs text-white">Cancel</button>` : ""}
          </td>
        `;
        tableBody.appendChild(row);
      });

      tableBody.querySelectorAll("[data-cancel-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            await window.apiService.cancelBooking(Number(btn.dataset.cancelId));
            showNotification("Booking cancelled.", "success");
            await loadData();
          } catch (error) {
            showNotification(error.message || "Failed to cancel booking.", "error");
          }
        });
      });
    };

    const loadData = async () => {
      loader.classList.remove("hidden");
      try {
        const [studiosData, bookingsData] = await Promise.all([
          window.apiService.getStudios(),
          window.apiService.getBookings()
        ]);
        studios = studiosData || [];
        bookings = bookingsData || [];

        studioSelect.innerHTML = '<option value="">Select studio</option>';
        studios.forEach((s) => {
          const opt = document.createElement("option");
          opt.value = s.id;
          opt.textContent = `${s.name} ($${Number(s.hourlyRate).toFixed(2)}/h)`;
          studioSelect.appendChild(opt);
        });

        renderBookings();
      } catch (error) {
        showNotification(error.message || "Failed to load dashboard data.", "error");
      } finally {
        loader.classList.add("hidden");
      }
    };

    [studioSelect, startInput, endInput].forEach((el) => el?.addEventListener("change", recalcPrice));
    filterStatus?.addEventListener("change", renderBookings);
    filterDate?.addEventListener("change", renderBookings);

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = document.getElementById("booking-submit");
      const studioId = Number(studioSelect.value);
      const bookingDate = dateInput.value;
      const startTime = startInput.value;
      const endTime = endInput.value;

      if (!studioId || !bookingDate || !startTime || !endTime) {
        showNotification("Fill all booking fields.", "error");
        return;
      }
      if (endTime <= startTime) {
        showNotification("End time must be later than start time.", "error");
        return;
      }

      try {
        setButtonLoading(submit, true, "Book now", "Booking...");
        await window.apiService.createBooking(studioId, bookingDate, startTime, endTime);
        showNotification("Booking created.", "success");
        form.reset();
        priceOutput.textContent = "$0.00";
        await loadData();
      } catch (error) {
        showNotification(error.message || "Booking failed.", "error");
      } finally {
        setButtonLoading(submit, false, "Book now", "Booking...");
      }
    });

    await loadData();
  }

  async function initBookingsPage() {
    const user = window.authService.getCurrentUser();
    const role = parseRole(user?.role);
    const scope = document.getElementById("bookings-scope");
    const body = document.getElementById("bookings-table-body");
    const filter = document.getElementById("bookings-filter");
    const sort = document.getElementById("bookings-sort");
    const loading = document.getElementById("bookings-loading");

    let rows = [];
    let studios = [];

    if (scope) {
      scope.textContent =
        role === "admin"
          ? "Admin view: all accessible bookings."
          : role === "manager"
            ? "Manager view: manage bookings and confirm pending items."
            : "User view: your personal bookings.";
    }

    const render = () => {
      const statusFilter = filter?.value || "all";
      const sortValue = sort?.value || "date-desc";

      let result = rows.filter((r) => {
        if (statusFilter === "all") return true;
        return statusToLabel(r.status).toLowerCase() === statusFilter;
      });

      result = result.sort((a, b) => {
        const da = new Date(a.bookingDate).getTime();
        const db = new Date(b.bookingDate).getTime();
        return sortValue === "date-asc" ? da - db : db - da;
      });

      body.innerHTML = "";
      result.forEach((item) => {
        const studio = studios.find((s) => s.id === item.studioId);
        const canConfirm = (role === "manager" || role === "admin") && statusToLabel(item.status).toLowerCase() === "pending";

        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-800";
        tr.innerHTML = `
          <td class="px-3 py-3">${studio?.name || `Studio #${item.studioId}`}</td>
          <td class="px-3 py-3">${formatDate(item.bookingDate)}</td>
          <td class="px-3 py-3">${formatTime(item.startTime)} - ${formatTime(item.endTime)}</td>
          <td class="px-3 py-3"><span class="rounded-full px-2 py-1 text-xs ${statusToClass(item.status)}">${statusToLabel(item.status)}</span></td>
          <td class="px-3 py-3">$${Number(item.totalPrice || 0).toFixed(2)}</td>
          <td class="px-3 py-3">
            ${canConfirm ? `<button data-confirm-id="${item.id}" class="rounded bg-emerald-500 px-3 py-1 text-xs text-white">Confirm</button>` : ""}
          </td>
        `;
        body.appendChild(tr);
      });

      body.querySelectorAll("[data-confirm-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            await window.apiService.updateBookingStatus(Number(btn.dataset.confirmId), 1);
            showNotification("Booking confirmed.", "success");
            await load();
          } catch (error) {
            showNotification(error.message || "Unable to update booking.", "error");
          }
        });
      });
    };

    const load = async () => {
      loading.classList.remove("hidden");
      try {
        const [bookings, studioList] = await Promise.all([
          window.apiService.getBookings(),
          window.apiService.getStudios()
        ]);
        rows = bookings || [];
        studios = studioList || [];
        render();
      } catch (error) {
        showNotification(error.message || "Failed to load bookings.", "error");
      } finally {
        loading.classList.add("hidden");
      }
    };

    filter?.addEventListener("change", render);
    sort?.addEventListener("change", render);
    await load();
  }

  async function initManagerDashboardPage() {
    const loading = document.getElementById("manager-loading");
    const todayCount = document.getElementById("manager-stat-today");
    const monthRevenue = document.getElementById("manager-stat-revenue");
    const capacity = document.getElementById("manager-stat-capacity");
    const tableBody = document.getElementById("manager-bookings-body");
    const chart = document.getElementById("manager-chart");
    const notifications = document.getElementById("manager-notifications");

    loading.classList.remove("hidden");
    try {
      const [bookings, studios] = await Promise.all([
        window.apiService.getBookings(),
        window.apiService.getStudios()
      ]);

      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const month = now.toISOString().slice(0, 7);

      const list = bookings || [];
      const todayList = list.filter((b) => String(b.bookingDate).startsWith(today));
      const monthList = list.filter((b) => String(b.bookingDate).startsWith(month));
      const monthTotal = monthList.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

      todayCount.textContent = String(todayList.length);
      monthRevenue.textContent = `$${monthTotal.toFixed(2)}`;

      const totalCapacity = (studios || []).reduce((sum, s) => sum + Number(s.maxCapacity || 0), 0);
      const bookedHours = todayList.reduce((sum, b) => {
        const start = getTimeFromString(b.startTime);
        const end = getTimeFromString(b.endTime);
        if (!start || !end) return sum;
        return sum + Math.max(0, (end.hours + end.minutes / 60) - (start.hours + start.minutes / 60));
      }, 0);
      const capPercent = totalCapacity > 0 ? Math.min(100, Math.round((bookedHours / (totalCapacity * 12)) * 100)) : 0;
      capacity.textContent = `${capPercent}%`;

      tableBody.innerHTML = "";
      list.slice(0, 12).forEach((item) => {
        const studio = (studios || []).find((s) => s.id === item.studioId);
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-800";
        tr.innerHTML = `
          <td class="px-3 py-3">${formatDate(item.bookingDate)}</td>
          <td class="px-3 py-3">${studio?.name || `Studio #${item.studioId}`}</td>
          <td class="px-3 py-3">${formatTime(item.startTime)} - ${formatTime(item.endTime)}</td>
          <td class="px-3 py-3"><span class="rounded-full px-2 py-1 text-xs ${statusToClass(item.status)}">${statusToLabel(item.status)}</span></td>
          <td class="px-3 py-3"><button data-confirm-id="${item.id}" class="rounded bg-emerald-500 px-3 py-1 text-xs text-white">Confirm</button></td>
        `;
        tableBody.appendChild(tr);
      });

      tableBody.querySelectorAll("[data-confirm-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            await window.apiService.updateBookingStatus(Number(btn.dataset.confirmId), 1);
            showNotification("Booking confirmed.", "success");
            await initManagerDashboardPage();
          } catch (error) {
            showNotification(error.message || "Unable to confirm booking.", "error");
          }
        });
      });

      const byDay = {};
      monthList.forEach((x) => {
        const day = String(x.bookingDate).slice(8, 10);
        byDay[day] = (byDay[day] || 0) + Number(x.totalPrice || 0);
      });
      const bars = Object.entries(byDay)
        .sort(([a], [b]) => Number(a) - Number(b))
        .slice(-10)
        .map(([day, total]) => {
          const height = Math.min(120, Math.max(8, Number(total)));
          return `<div class="flex flex-col items-center gap-2"><div class="w-6 rounded-t bg-sky-400" style="height:${height}px"></div><span class="text-xs text-slate-400">${day}</span></div>`;
        })
        .join("");
      chart.innerHTML = bars || '<p class="text-sm text-slate-400">No chart data yet.</p>';

      const pending = list.filter((x) => statusToLabel(x.status).toLowerCase() === "pending").length;
      notifications.innerHTML = pending
        ? `<p class="rounded border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-amber-300">${pending} new pending booking(s) require attention.</p>`
        : `<p class="rounded border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-emerald-300">No new pending bookings.</p>`;
    } catch (error) {
      showNotification(error.message || "Failed to load manager dashboard.", "error");
    } finally {
      loading.classList.add("hidden");
    }
  }

  async function initAdminDashboardPage() {
    const loading = document.getElementById("admin-loading");
    const statUsers = document.getElementById("admin-stat-users");
    const statBookings = document.getElementById("admin-stat-bookings");
    const statRevenue = document.getElementById("admin-stat-revenue");
    const usersBody = document.getElementById("admin-users-body");
    const logs = document.getElementById("admin-logs");

    loading.classList.remove("hidden");
    try {
      const [users, bookings] = await Promise.all([
        window.apiService.getAllUsers(),
        window.apiService.getBookings()
      ]);

      const usersList = users || [];
      const bookingsList = bookings || [];

      statUsers.textContent = String(usersList.length);
      statBookings.textContent = String(bookingsList.length);
      statRevenue.textContent = `$${bookingsList.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0).toFixed(2)}`;

      usersBody.innerHTML = "";
      usersList.forEach((user) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-800";
        tr.innerHTML = `
          <td class="px-3 py-3">${user.email}</td>
          <td class="px-3 py-3">${user.firstName || ""} ${user.lastName || ""}</td>
          <td class="px-3 py-3">${user.role}</td>
          <td class="px-3 py-3">
            <select data-role-id="${user.id}" class="w-32 rounded bg-slate-900 px-2 py-1 text-xs">
              <option>User</option>
              <option>Manager</option>
              <option>Admin</option>
            </select>
          </td>
          <td class="px-3 py-3">
            <button data-delete-id="${user.id}" class="rounded bg-rose-500 px-3 py-1 text-xs text-white">Delete</button>
          </td>
        `;
        usersBody.appendChild(tr);

        const select = tr.querySelector(`[data-role-id="${user.id}"]`);
        if (select) {
          select.value = String(user.role);
          select.addEventListener("change", () => {
            showNotification("Role update endpoint is not implemented yet.", "alert");
          });
        }
      });

      usersBody.querySelectorAll("[data-delete-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            await window.apiService.deleteUser(Number(btn.dataset.deleteId));
            showNotification("User deleted.", "success");
            await initAdminDashboardPage();
          } catch (error) {
            showNotification(error.message || "Failed to delete user.", "error");
          }
        });
      });

      logs.innerHTML = `
        <li class="text-slate-300">Loaded ${usersList.length} users.</li>
        <li class="text-slate-300">Loaded ${bookingsList.length} bookings for analytics.</li>
        <li class="text-slate-300">User role edits are currently UI-only until backend endpoint is added.</li>
      `;
    } catch (error) {
      showNotification(error.message || "Failed to load admin dashboard.", "error");
    } finally {
      loading.classList.add("hidden");
    }
  }

  async function initProfilePage() {
    const loading = document.getElementById("profile-loading");
    const email = document.getElementById("profile-email");
    const firstName = document.getElementById("profile-first-name");
    const lastName = document.getElementById("profile-last-name");
    const role = document.getElementById("profile-role");
    const history = document.getElementById("profile-booking-history");
    const editBtn = document.getElementById("profile-edit");
    const passBtn = document.getElementById("profile-password");
    const logoutBtn = document.getElementById("profile-logout");

    loading.classList.remove("hidden");
    try {
      const [profile, bookings] = await Promise.all([
        window.apiService.getProfile(),
        window.apiService.getBookings()
      ]);

      email.textContent = profile?.email || "-";
      firstName.textContent = profile?.firstName || "-";
      lastName.textContent = profile?.lastName || "-";
      role.textContent = profile?.role || "-";

      const recent = (bookings || [])
        .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
        .slice(0, 5);

      history.innerHTML = recent.length
        ? recent
            .map((b) => `<li class="rounded border border-slate-700 px-3 py-2 text-sm text-slate-300">${formatDate(b.bookingDate)} • ${formatTime(b.startTime)}-${formatTime(b.endTime)} • ${statusToLabel(b.status)}</li>`)
            .join("")
        : '<li class="text-slate-400">No bookings yet.</li>';
    } catch (error) {
      showNotification(error.message || "Failed to load profile.", "error");
    } finally {
      loading.classList.add("hidden");
    }

    editBtn?.addEventListener("click", () => showNotification("Profile edit endpoint is not implemented yet.", "alert"));
    passBtn?.addEventListener("click", () => showNotification("Password change endpoint is not implemented yet.", "alert"));
    logoutBtn?.addEventListener("click", async () => {
      await window.componentService.logout();
    });
  }

  window.pageInitializers = {
    landing: async () => {},
    login: initLoginPage,
    register: initRegisterPage,
    "dashboard-user": initUserDashboardPage,
    bookings: initBookingsPage,
    "dashboard-manager": initManagerDashboardPage,
    "dashboard-admin": initAdminDashboardPage,
    profile: initProfilePage
  };
})();
