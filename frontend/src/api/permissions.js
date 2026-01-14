export function canAccessTab(user, tabKey) {
  const role = (user?.role || "").replace(/^ROLE_/, "");
  const position = (user?.position || "").toLowerCase();

  if (role !== "EMPLOYEE") return false;

  if (tabKey === "checkinout") return position.includes("recepc"); 
  if (tabKey === "maintenance_report") return position.includes("recepc"); 
  if (tabKey === "maintenance") return position.includes("konserw"); 
  if (tabKey === "housekeeping")
    return (
      position.includes("house") ||
      position.includes("pokoj") ||
      position.includes("sprzat")
    );

  return true;
}