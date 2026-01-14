import http from "./http";

export async function getEmployees() {
  const { data } = await http.get("/operations/employees", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function createEmployee(payload) {
  const { data } = await http.post("/operations/employees", payload, {
    headers: { Accept: "application/json" },
  });
  return data;
}

export async function checkInReservation(reservationId) {
  const { data } = await http.patch(
    `/operations/api/operations/reservations/${reservationId}/checkin`,
    null,
    { headers: { Accept: "application/json" } }
  );
  return data;
}

export async function checkOutReservation(reservationId) {
  const { data } = await http.patch(
    `/operations/api/operations/reservations/${reservationId}/checkout`,
    null,
    { headers: { Accept: "application/json" } }
  );
  return data;
}

export async function getEmployeePositions() {
  const { data } = await http.get("/operations/employees/positions", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function deleteEmployee(employeeId) {
  await http.delete(`/operations/employees/${employeeId}`, {
    headers: { Accept: "application/json" },
  });
}

export async function getMaintenance() {
  const { data } = await http.get("/operations/maintenance", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function createMaintenance(payload) {
  const { data } = await http.post("/operations/maintenance", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

export async function updateMaintenance(id, payload) {
  const { data } = await http.put(`/operations/maintenance/${id}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

export async function deleteMaintenance(id) {
  await http.delete(`/operations/maintenance/${id}`, {
    headers: { Accept: "application/json" },
  });
}