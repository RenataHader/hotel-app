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