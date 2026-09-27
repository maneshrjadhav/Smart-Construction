/**
 * Role and Permission Helpers
 */

export function isAdmin(user) {
  if (!user || !user.role) return false;
  const role = String(user.role).trim().toLowerCase();
  return role === "administrator" || role === "admin";
}

export function isEngineer(user) {
  if (!user || !user.role) return false;
  const role = String(user.role).trim().toLowerCase();
  return role === "engineer";
}

export function hasPermission(user, allowedRoles = []) {
  if (!user || !user.role) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const userRole = String(user.role).trim().toLowerCase();
  return allowedRoles.some((r) => r.toLowerCase() === userRole);
}

