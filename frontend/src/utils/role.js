export function normalizeRole(role) {
  return (role || "").replace(/^ROLE_/, "");
}

export function homeByRole(roleRaw) {
  const role = normalizeRole(roleRaw);

  if (role === "ADMIN" || role === "MANAGER") return "/admin";
  if (role === "RECEPTIONIST") return "/staff";
  return "/guest";
}

export function isNextAllowed(nextPath, roleRaw) {
  const role = normalizeRole(roleRaw);
  if (!nextPath) return false;

  if (role === "ADMIN" || role === "MANAGER") {
    return nextPath.startsWith("/admin") || nextPath.startsWith("/staff");
}
  if (role === "RECEPTIONIST") {
    return nextPath.startsWith("/staff");
  }
  return nextPath.startsWith("/guest");
}
