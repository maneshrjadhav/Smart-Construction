/**
 * Formats any ISO date or date string into standard human-readable format: "03 Sep 2026"
 * Never returns raw ISO strings or "Invalid Date".
 */
export function formatDate(dateInput, fallback = "—") {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;

    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
  } catch (_) {
    return fallback;
  }
}

/**
 * Formats date into standard YYYY-MM-DD format for HTML date inputs
 */
export function formatDateForInput(dateInput) {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch (_) {
    return "";
  }
}

