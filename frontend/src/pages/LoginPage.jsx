import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";


export default function LoginPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const u = await signIn(email, password);
      // na razie tylko gość
      if (u.role === "GUEST") nav("/guest");
      else nav("/guest"); // później rozdzielimy role
    } catch (e2) {
      console.error(e2);
      setErr("Niepoprawny email lub hasło (albo backend nie działa).");
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 420, margin: "40px auto" }}>
      <h1>Logowanie</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10 }}
            type="email"
            required
          />
        </label>

        <label>
          Hasło
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10 }}
            type="password"
            required
          />
        </label>

        {err && <div style={{ color: "crimson" }}>{err}</div>}

        <button style={{ padding: 10 }} type="submit">Zaloguj</button>
      </form>

      <p style={{ marginTop: 14 }}>
        Nie masz konta? <Link to="/register">Utwórz konto</Link>
        </p>
    </div>
  );
}
