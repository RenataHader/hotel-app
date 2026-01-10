import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const next = params.get("next"); // np. "/guest"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const u = await signIn(email, password);

      // 1) jeśli mamy next → wracamy tam
      if (next) {
        nav(next);
        return;
      }

      // 2) fallback (jak nie ma next)
      if (u?.role === "GUEST") nav("/guest");
      else nav("/guest");
    } catch (e2) {
      console.error(e2);
      const msg =
        e2?.response?.data?.message ||
        (typeof e2?.response?.data === "string" ? e2.response.data : null) ||
        "Niepoprawny email lub hasło (albo backend nie działa).";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Logowanie</h1>
        <p className="auth-subtitle">Zaloguj się, żeby przejść dalej</p>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="field">
            <label>
              Email
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </label>
          </div>

          <div className="field">
            <label>
              Hasło
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </label>
          </div>

          {err && <div className="error">{err}</div>}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Loguję..." : "Zaloguj"}
          </button>
        </form>

        <p className="auth-footer">
          Nie masz konta?{" "}
          <Link className="auth-link" to="/register">
            Utwórz konto
          </Link>
        </p>
      </div>
    </div>
  );
}
