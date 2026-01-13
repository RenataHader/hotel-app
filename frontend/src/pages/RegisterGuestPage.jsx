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

  const [password2, setPassword2] = useState("");
  const [showDoc, setShowDoc] = useState(false);

  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));


    setFieldErrors((prev) => {
      if (!prev || !prev[name]) return prev;
      return { ...prev, [name]: undefined };
    });


    if (err) setErr("");
    if (ok) setOk("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    setFieldErrors({});

    if (form.password !== password2) {
      setErr("Hasła nie są identyczne.");
      return;
    }

    try {
      await registerGuest(form);
      setOk("Konto utworzone! Możesz się teraz zalogować.");
      setTimeout(() => nav("/login"), 900);
    } catch (e2) {
      console.error(e2);


      const fields = e2?.response?.data?.fields;
      if (fields && typeof fields === "object") {
        setFieldErrors(fields);
        return;
      }


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
              <div className="pass-field">
                <input
                  className={`input ${fieldErrors.password ? "input--error" : ""}`}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  type={showPass1 ? "text" : "password"}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="btn-small pass-btn"
                  onClick={() => setShowPass1((v) => !v)}
                >
                  {showPass1 ? "Ukryj" : "Pokaż"}
                </button>
              </div>
            </label>
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
          </div>

          <div className="field">
            <label>
              Powtórz hasło
              <div className="pass-field">
                <input
                  className={`input ${err === "Hasła nie są identyczne." ? "input--error" : ""}`}
                  value={password2}
                  onChange={(e) => {
                    setPassword2(e.target.value);
                    if (err) setErr("");
                    if (ok) setOk("");
                  }}
                  type={showPass2 ? "text" : "password"}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="btn-small pass-btn"
                  onClick={() => setShowPass2((v) => !v)}
                >
                  {showPass2 ? "Ukryj" : "Pokaż"}
                </button>
              </div>
            </label>
            {err === "Hasła nie są identyczne." && (
              <div className="field-error">Hasła nie są identyczne.</div>
            )}
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
              <div className="doc-field">
                <input
                  className={`input ${fieldErrors.documentNumber ? "input--error" : ""}`}
                  value={form.documentNumber}
                  onChange={(e) => setField("documentNumber", e.target.value.toUpperCase())}
                  autoCapitalize="characters"
                  placeholder="np. ABC123456"
                  type={showDoc ? "text" : "password"}
                  required
                />

                <button
                  type="button"
                  className="btn-small doc-btn"
                  onClick={() => setShowDoc((v) => !v)}
                >
                  {showDoc ? "Ukryj" : "Pokaż"}
                </button>
              </div>
            </label>

            {fieldErrors.documentNumber && <div className="field-error">{fieldErrors.documentNumber}</div>}
          </div>
          
          {err && err !== "Hasła nie są identyczne." && <div className="error">{err}</div>}
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
