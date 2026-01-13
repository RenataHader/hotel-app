export function canAccessTab(user, tabKey) {
  const role = (user?.role || "").replace(/^ROLE_/, "");
  const position = (user?.position || "").toLowerCase();

  if (role !== "EMPLOYEE") return false;

  // reguły per zakładka:
  if (tabKey === "checkinout") return position.includes("recepc"); // Recepcjonista
  if (tabKey === "maintenance") return position.includes("konserw"); // Konserwator
  if (tabKey === "housekeeping") return position.includes("house") || position.includes("pokoj") || position.includes("sprzat");
  
  // domyślnie: dostępne dla każdego EMPLOYEE
  return true;
}
