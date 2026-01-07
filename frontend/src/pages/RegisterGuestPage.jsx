import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerGuest } from "../api/auth";

export default function RegisterGuestPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    documentNumber: "",
  });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    try {
      await registerGuest(form);
      setOk("Konto utworzone! Możesz się teraz zalogować.");
      // po 1s przerzucamy na login
      setTimeout(() => nav("/login"), 900);
    } catch (e2) {
      console.error(e2);
      const msg =
        e2?.response?.data?.message ||
        (typeof e2?.response?.data === "string" ? e2.response.data : null) ||
        "Nie udało się utworzyć konta. Sprawdź dane.";
      setErr(msg);
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 520, margin: "40px auto" }}>
      <h1>Rejestracja gościa</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <input
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            style={{ width: "100%", padding: 10 }}
            type="email"
            required
          />
        </label>

        <label>
          Hasło
          <input
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            style={{ width: "100%", padding: 10 }}
            type="password"
            required
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            Imię
            <input
              value={form.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
              style={{ width: "100%", padding: 10 }}
              required
            />
          </label>

          <label>
            Nazwisko
            <input
              value={form.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
              style={{ width: "100%", padding: 10 }}
              required
            />
          </label>
        </div>

        <label>
          Telefon
          <input
            value={form.phoneNumber}
            onChange={(e) => setField("phoneNumber", e.target.value)}
            style={{ width: "100%", padding: 10 }}
            required
          />
        </label>

        <label>
          Numer dokumentu
          <input
            value={form.documentNumber}
            onChange={(e) => setField("documentNumber", e.target.value)}
            style={{ width: "100%", padding: 10 }}
            required
          />
        </label>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {ok && <div style={{ color: "green" }}>{ok}</div>}

        <button style={{ padding: 10 }} type="submit">
          Utwórz konto
        </button>
      </form>

      <p style={{ marginTop: 14 }}>
        Masz już konto? <Link to="/login">Zaloguj się</Link>
      </p>
    </div>
  );
}
