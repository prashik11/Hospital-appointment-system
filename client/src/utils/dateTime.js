export function convertToTimeInput(time) {
  if (!time) return "";

  // Already in HH:mm format
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }

  // Convert "10:30 AM" → "10:30"
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return "";
  }

  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function formatTimeForDisplay(time) {
  if (!time) return "";

  const match = time.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return time;
  }

  let hour = Number(match[1]);
  const minute = match[2];

  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${period}`;
}
