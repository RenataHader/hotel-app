// src/api/auth.js
import http from "./http";
import { API } from "./endpoints";

export async function login(email, password) {
  const { data } = await http.post(API.identity.login, { email, password });
  return data; // {token, tokenType, expiresIn, accountId, email, role}
}

export async function registerGuest(payload) {
  const { data } = await http.post(API.identity.registerGuest, payload);
  return data;
}

export async function me() {
  const { data } = await http.get(API.identity.me);
  return data; // {id, email, role, employeeId, guestId}
}
