import axios from "axios";

const baseURL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "");

const http = axios.create({
  baseURL,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function broadcastLogout() {
  try {
    window.dispatchEvent(new Event("auth:logout"));
  } catch {}
}

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    if (status === 401) {
      const hadAuthHeader = Boolean(err?.config?.headers?.Authorization);
      const token = localStorage.getItem("token");

      // nie psujemy loginu, jeśli ktoś podał złe hasło (brak tokena)
      if (hadAuthHeader || token) {
        localStorage.removeItem("token");
        broadcastLogout();

        const path = window.location.pathname || "/";
        const search = window.location.search || "";
        const hash = window.location.hash || "";
        const next = encodeURIComponent(path + search + hash);

        if (!path.startsWith("/login")) {
          window.location.assign(`/login?next=${next}`);
        }
      }
    }

    return Promise.reject(err);
  }
);

export default http;
