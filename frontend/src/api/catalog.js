// src/api/catalog.js
import http from "./http";

export async function getHotels() {
  const { data } = await http.get("/catalog/hotels", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

/** GET /catalog/api/rooms/available?hotelId&from&to */
export async function getAvailableRooms({ hotelId, from, to }) {
  const { data } = await http.get("/catalog/api/rooms/available", {
    params: { hotelId, from, to },
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

/** GET /catalog/catering */
export async function getMeals() {
  const { data } = await http.get("/catalog/catering", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}

/** GET /catalog/services */
export async function getServices() {
  const { data } = await http.get("/catalog/services", {
    headers: { Accept: "application/json" },
  });
  return Array.isArray(data) ? data : [];
}
