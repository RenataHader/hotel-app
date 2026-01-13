import http from "./http";

export async function getHotels() {
  const { data } = await http.get("/catalog/hotels", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function getAvailableRooms({ hotelId, from, to }) {
  const { data } = await http.get("/catalog/api/rooms/available", {
    params: { hotelId, from, to },
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function getMeals() {
  const { data } = await http.get("/catalog/catering", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function getServices() {
  const { data } = await http.get("/catalog/services", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function getRooms() {
  const { data } = await http.get("/catalog/api/rooms", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

export async function createRoom(payload) {
  const { data } = await http.post("/catalog/api/rooms", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

export async function getRoomTypes(hotelId) {
  const { data } = await http.get("/catalog/api/rooms/types", {
    params: hotelId ? { hotelId } : {},
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}
