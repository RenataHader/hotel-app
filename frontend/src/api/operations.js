// src/api/operations.js
import http from "./http";

export async function getServices() {
  try {
    const { data } = await http.get("/operations/api/services", {
      headers: { Accept: "application/json" },
    });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (e?.response?.status === 404) return [];
    throw e;
  }
}

export async function getMealPlans() {
  try {
    const { data } = await http.get("/operations/api/meal-plans", {
      headers: { Accept: "application/json" },
    });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (e?.response?.status === 404) return [];
    throw e;
  }
}
