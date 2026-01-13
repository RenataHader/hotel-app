export function normalizeRole(role) {
  return (role || "").replace(/^ROLE_/, "");
}

export function homeByRole(roleRaw) {
  const role = normalizeRole(roleRaw);
  if (role === "ADMIN") return "/admin";
  if (role === "EMPLOYEE") return "/staff";
  return "/guest";
}


export function isNextAllowed(nextPath, roleRaw) {
  const role = normalizeRole(roleRaw);
  if (!nextPath) return false;

  if (role === "ADMIN") return nextPath.startsWith("/admin");
  if (role === "EMPLOYEE") return nextPath.startsWith("/staff");
  return nextPath.startsWith("/guest");
}
