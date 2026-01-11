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

  // ogólny błąd (np. serwer, konflikt, itp.)
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // błędy per pole z backendu: { email: "...", password: "..." }
  const [fieldErrors, setFieldErrors] = useState({});

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));

    // czyść błąd tylko dla tego pola
    setFieldErrors((prev) => {
      if (!prev || !prev[name]) return prev;
      return { ...prev, [name]: undefined };
    });

    // czyść ogólny komunikat przy edycji
    if (err) setErr("");
    if (ok) setOk("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    setFieldErrors({});

    try {
      await registerGuest(form);
      setOk("Konto utworzone! Możesz się teraz zalogować.");
      setTimeout(() => nav("/login"), 900);
    } catch (e2) {
      console.error(e2);

      // ✅ walidacja z backendu (Twoje: { fields: { ... } })
      const fields = e2?.response?.data?.fields;
      if (fields && typeof fields === "object") {
        setFieldErrors(fields);
        return;
      }

      // fallback: inne błędy (np. 409 email zajęty, 500, itd.)
      const msg =
        e2?.response?.data?.message ||
        e2?.response?.data?.error ||
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

        <form onSubmit={onSubmit} className="auth-form" noValidate>
          <div className="field">
            <label>
              Email
              <input
                className={`input ${fieldErrors.email ? "input--error" : ""}`}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </label>
            {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
          </div>

          <div className="field">
            <label>
              Hasło
              <input
                className={`input ${fieldErrors.password ? "input--error" : ""}`}
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                type="password"
                autoComplete="new-password"
                required
              />
            </label>
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
          </div>

          <div className="grid-2">
            <div className="field">
              <label>
                Imię
                <input
                  className={`input ${fieldErrors.firstName ? "input--error" : ""}`}
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  autoComplete="given-name"
                  required
                />
              </label>
              {fieldErrors.firstName && <div className="field-error">{fieldErrors.firstName}</div>}
            </div>

            <div className="field">
              <label>
                Nazwisko
                <input
                  className={`input ${fieldErrors.lastName ? "input--error" : ""}`}
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  autoComplete="family-name"
                  required
                />
              </label>
              {fieldErrors.lastName && <div className="field-error">{fieldErrors.lastName}</div>}
            </div>
          </div>

          <div className="field">
            <label>
              Telefon
              <input
                className={`input ${fieldErrors.phoneNumber ? "input--error" : ""}`}
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="np. 123456789"
                required
              />
            </label>
            {fieldErrors.phoneNumber && <div className="field-error">{fieldErrors.phoneNumber}</div>}
          </div>

          <div className="field">
            <label>
              Numer dokumentu
              <input
                className={`input ${fieldErrors.documentNumber ? "input--error" : ""}`}
                value={form.documentNumber}
                onChange={(e) => setField("documentNumber", e.target.value.toUpperCase())}
                autoCapitalize="characters"
                placeholder="np. ABC123456"
                required
              />
            </label>
            {fieldErrors.documentNumber && <div className="field-error">{fieldErrors.documentNumber}</div>}
          </div>

          {/* ogólne komunikaty (nie walidacja pól) */}
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
