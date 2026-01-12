import http from "./http";

export async function quoteReservation(payload) {
  const { data } = await http.post("/booking/api/reservations/quote", payload, {
    headers: { Accept: "application/json" },
  });
  return data;
}

export async function createReservation(payload) {
  const { data } = await http.post("/booking/api/reservations", payload, {
    headers: { Accept: "application/json" },
  });
  return data;
}

export async function getMyReservations() {
  const { data } = await http.get("/booking/api/reservations/my", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function getHotelReservations() {
  const { data } = await http.get("/booking/api/reservations/hotel", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function getAllReservations() {
  const { data } = await http.get("/booking/api/reservations", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function getGuests() {
  const { data } = await http.get("/booking/guests", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function cancelReservation(id) {
  await http.patch(`/booking/api/reservations/${id}/cancel`, null, {
    headers: { Accept: "application/json" },
  });
}
