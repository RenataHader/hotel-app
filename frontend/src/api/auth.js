import http from "./http";

export async function login(email, password) {
  const { data } = await http.post("/identity/auth/login", { email, password });
  return data; // {token, tokenType, expiresIn, accountId, email, role}
}

export async function registerGuest(payload) {
  const { data } = await http.post("/identity/auth/register-guest", payload);
  return data;
}

export async function me() {
  const { data } = await http.get("/identity/accounts/me");
  return data; // {id, email, role, employeeId, guestId}
}
