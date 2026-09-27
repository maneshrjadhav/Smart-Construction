/**
 * Formats numbers into Indian Rupee currency: "₹50,000"
 * Never returns NaN, undefined, or null.
 */
export function formatCurrency(val, fallback = "₹0") {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
    return fallback;
  }
  const num = Math.round(Number(val));
  return "₹" + num.toLocaleString("en-IN");
}

/**
 * Formats percentage: "78%"
 */
export function formatPercent(val, fallback = "0%") {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
    return fallback;
  }
  const num = parseFloat(val);
  return (num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)) + "%";
}

/**
 * Sanitizes empty/null/undefined values to a clean dash "—"
 */
export function formatValue(val, fallback = "—") {
  if (
    val === null ||
    val === undefined ||
    val === "" ||
    String(val).toLowerCase() === "null" ||
    String(val).toLowerCase() === "undefined" ||
    String(val) === "NaN"
  ) {
    return fallback;
  }
  return String(val);
}

