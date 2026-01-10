import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerGuest } from "../api/auth";
import "./RegisterGuestPage.css";

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
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <h1 className="auth-title">Rejestracja</h1>
        <p className="auth-subtitle">Utwórz konto gościa, aby przejść dalej</p>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="field">
            <label>
              Email
              <input
                className="input"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
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
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                type="password"
                required
              />
            </label>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>
                Imię
                <input
                  className="input"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="field">
              <label>
                Nazwisko
                <input
                  className="input"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  required
                />
              </label>
            </div>
          </div>

          <div className="field">
            <label>
              Telefon
              <input
                className="input"
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                required
              />
            </label>
          </div>

          <div className="field">
            <label>
              Numer dokumentu
              <input
                className="input"
                value={form.documentNumber}
                onChange={(e) => setField("documentNumber", e.target.value)}
                required
              />
            </label>
          </div>

          {err && <div className="error">{err}</div>}
          {ok && <div className="success">{ok}</div>}

          <button className="btn" type="submit">
            Utwórz konto
          </button>
        </form>

        <p className="auth-footer">
          Masz już konto?{" "}
          <Link className="auth-link" to="/login">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
