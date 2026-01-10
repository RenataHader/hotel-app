import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, me as apiMe } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    function onLogout() {
      setToken(null);
      setUser(null);
      setLoading(false);
    }

    function onStorage(e) {
      if (e.key === "token") {
        setToken(localStorage.getItem("token"));
      }
    }

    window.addEventListener("auth:logout", onLogout);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth:logout", onLogout);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const u = await apiMe();
        if (!cancelled) setUser(u);
      } catch (e) {
        console.error(e);
        localStorage.removeItem("token");
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      async signIn(email, password) {
        const res = await apiLogin(email, password);
        localStorage.setItem("token", res.token);
        setToken(res.token);
        const u = await apiMe();
        setUser(u);
        return u;
      },
      signOut() {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        try {
          window.dispatchEvent(new Event("auth:logout"));
        } catch {}
      },
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
