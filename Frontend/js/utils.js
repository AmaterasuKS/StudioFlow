function formatDate(date) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "";

  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();

  return `${day}.${month}.${year}`;
}

function formatTime(time) {
  if (time == null) return "";

  if (typeof time === "string") {
    const [hours = "00", minutes = "00"] = time.split(":");
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  if (time instanceof Date) {
    return `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
  }

  return "";
}

function showNotification(message, type = "alert") {
  const allowedTypes = ["alert", "success", "error"];
  const safeType = allowedTypes.includes(type) ? type : "alert";

  const note = document.createElement("div");
  note.className = `sf-notification sf-notification--${safeType}`;
  note.textContent = message;
  document.body.appendChild(note);

  window.setTimeout(() => {
    note.remove();
  }, 3000);
}

function calculatePrice(hours, hourlyRate) {
  const total = Number(hours) * Number(hourlyRate);
  if (Number.isNaN(total)) return 0;
  return Math.round(total * 100) / 100;
}

function getTimeFromString(str) {
  if (typeof str !== "string" || !str.includes(":")) return null;

  const [h, m, s = "0"] = str.split(":");
  const hours = Number(h);
  const minutes = Number(m);
  const seconds = Number(s);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return {
    hours,
    minutes,
    seconds
  };
}
