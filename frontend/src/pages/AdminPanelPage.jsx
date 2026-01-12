import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/panelCommon.css";

import { getHotels } from "../api/catalog";
import { getAllReservations } from "../api/booking";
import { createEmployee, getEmployees } from "../api/operations";
import { registerEmployee } from "../api/auth";
import { useAuth } from "../auth/AuthContext";

const todayIso = () => new Date().toISOString().slice(0, 10);

function slugEmailPart(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\./, "")
    .replace(/\.$/, "");
}

function buildEmail(firstName, lastName, n = 0) {
  const f = slugEmailPart(firstName);
  const l = slugEmailPart(lastName);
  const base = [f, l].filter(Boolean).join(".");
  if (!base) return "";
  return n > 0 ? `${base}${n}@hotel.local` : `${base}@hotel.local`;
}

export default function AdminPanelPage() {
  const nav = useNavigate();
  const { user, signOut } = useAuth();

  const [view, setView] = useState("employees");

  const [hotels, setHotels] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reservations, setReservations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [hotelFilter, setHotelFilter] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    position: "Recepcjonista",
    hireDate: todayIso(),
    phoneNumber: "",
    hotelId: "",
    password: "",
    emailManual: false,
    email: "",
  });

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  useEffect(() => {
    function onDoc(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (form.emailManual) return;
    const next = buildEmail(form.firstName, form.lastName, 0);
    setForm((f) => ({ ...f, email: next }));
  }, [form.firstName, form.lastName, form.emailManual]);

  const hotelsById = useMemo(() => {
    const m = new Map();
    hotels.forEach((h) => m.set(h.id, h.name));
    return m;
  }, [hotels]);

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const [h, e, r] = await Promise.all([
        getHotels(),
        getEmployees(),
        getAllReservations(),
      ]);
      setHotels(Array.isArray(h) ? h : []);
      setEmployees(Array.isArray(e) ? e : []);
      setReservations(Array.isArray(r) ? r : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Błąd pobierania danych.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredReservations = useMemo(() => {
    if (!hotelFilter) return reservations;
    return reservations.filter((r) => String(r.hotelId) === String(hotelFilter));
  }, [reservations, hotelFilter]);

  function closeModal() {
    setModalOpen(false);
    setErr("");
    setOk("");
  }

  function openModal() {
    setOk("");
    setErr("");
    setModalOpen(true);
  }

  async function registerWithAutoEmail({
    employeeId,
    password,
    firstName,
    lastName,
    emailFromForm,
    emailManual,
  }) {
    const manual = (emailFromForm || "").trim();
    const useManual = Boolean(manual) && emailManual;

    const tryOne = async (email) => {
      await registerEmployee({
        email,
        password,
        employeeId,
        role: "RECEPTIONIST",
      });
      return email;
    };

    if (useManual) {
      return await tryOne(manual);
    }

    for (let i = 0; i <= 20; i++) {
      const email = buildEmail(firstName, lastName, i === 0 ? 0 : i);
      try {
        await tryOne(email);
        return email;
      } catch (e) {
        const status = e?.response?.status;
        const msg = e?.response?.data?.message || e?.response?.data || "";
        const isConflict =
          status === 409 ||
          String(msg).toLowerCase().includes("exists") ||
          String(msg).toLowerCase().includes("zajet") ||
          String(msg).toLowerCase().includes("already");

        if (isConflict) continue;
        throw e;
      }
    }

    throw new Error("Nie udało się wygenerować wolnego emaila (za dużo kolizji).");
  }

  async function onCreateEmployee(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    setBusy(true);

    try {
      const emp = await createEmployee({
        firstName: form.firstName,
        lastName: form.lastName,
        position: form.position,
        hireDate: form.hireDate,
        phoneNumber: form.phoneNumber || null,
        hotelId: Number(form.hotelId),
      });

      const finalEmail = await registerWithAutoEmail({
        employeeId: emp.id,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        emailFromForm: form.email,
        emailManual: form.emailManual,
      });

      setOk(`Utworzono pracownika i konto: ${finalEmail} (employeeId=${emp.id})`);

      setForm((f) => ({
        ...f,
        firstName: "",
        lastName: "",
        phoneNumber: "",
        password: "",
        emailManual: false,
        email: "",
      }));

      setModalOpen(false);
      await loadAll();
    } catch (e2) {
      console.error(e2);
      setErr(
        e2?.response?.data?.message ||
          (typeof e2?.response?.data === "string" ? e2.response.data : null) ||
          e2?.message ||
          "Nie udało się utworzyć pracownika/konta."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="panel-page">
        <div className="panel-wrap">
          <div className="panel-card">Ładowanie...</div>
        </div>
      </div>
    );
  }

  const roleLabel = (user?.role || "").replace(/^ROLE_/, "");

  return (
    <div className="panel-page">
      <div className="panel-wrap">
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Panel admina</h2>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="panel-btn" type="button" onClick={loadAll}>
                Odśwież
              </button>

              {view === "employees" && (
                <button className="panel-btn" type="button" onClick={openModal}>
                  + Dodaj pracownika
                </button>
              )}

              <div className="right" ref={menuRef}>
                <button
                  type="button"
                  className="account-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Menu konta"
                >
                  <span className="avatar">👤</span>
                </button>

                {menuOpen && (
                  <div className="dropdown">
                    {user ? (
                      <>
                        <div className="dropdown-head">
                          Zalogowano jako
                          <div className="dropdown-email">{user.email || "Użytkownik"}</div>
                        </div>

                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setView("employees");
                          }}
                        >
                          {view === "employees" ? "✓ " : ""}Pracownicy
                        </button>

                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setView("reservations");
                          }}
                        >
                          {view === "reservations" ? "✓ " : ""}Rezerwacje
                        </button>

                        <div className="dropdown-sep" />

                        <button
                          className="dropdown-item danger"
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            signOut();
                            nav("/login", { replace: true });
                          }}
                        >
                          Wyloguj
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="dropdown-head">Nie jesteś zalogowana</div>
                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            nav("/login", { replace: true });
                          }}
                        >
                          Zaloguj
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {err && <div className="panel-error">{err}</div>}
          {ok && (
            <div
              className="panel-box"
              style={{
                borderColor: "rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.10)",
                marginTop: 12,
              }}
            >
              {ok}
            </div>
          )}

          {view === "employees" ? (
            <section className="panel-box" style={{ marginTop: 12 }}>
              <div className="panel-head">
                <h3 className="panel-h3" style={{ margin: 0 }}>
                  Lista pracowników
                </h3>
                <div className="panel-sub">{employees.length} pozycji</div>
              </div>

              {employees.length === 0 ? (
                <div style={{ opacity: 0.85, marginTop: 10 }}>Brak pracowników.</div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Imię</th>
                        <th>Nazwisko</th>
                        <th>Stanowisko</th>
                        <th>Hotel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((e) => (
                        <tr key={e.id}>
                          <td>{e.id}</td>
                          <td>{e.firstName}</td>
                          <td>{e.lastName}</td>
                          <td>
                            <span className="pill">{e.position}</span>
                          </td>
                          <td>{hotelsById.get(e.hotelId) || `hotelId=${e.hotelId}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : (
            <section className="panel-box" style={{ marginTop: 12 }}>
              <div className="panel-head">
                <h3 className="panel-h3" style={{ margin: 0 }}>
                  Rezerwacje
                </h3>

                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ opacity: 0.85, fontSize: 12 }}>Hotel:</span>
                  <select
                    className="select-glass"
                    value={hotelFilter}
                    onChange={(e) => setHotelFilter(e.target.value)}
                    style={{ width: 260 }}
                  >
                    <option value="">Wszystkie</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {filteredReservations.length === 0 ? (
                <div style={{ opacity: 0.85, marginTop: 10 }}>Brak rezerwacji.</div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Hotel</th>
                        <th>Gość</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservations.map((r) => (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td>{r.hotelName || hotelsById.get(r.hotelId) || r.hotelId}</td>
                          <td>{r.guestFullName || "-"}</td>
                          <td>{String(r.checkInDate)}</td>
                          <td>{String(r.checkOutDate)}</td>
                          <td>
                            <span className="pill">{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>


        {modalOpen && (
          <div className="modal-backdrop" onMouseDown={closeModal}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3 className="modal-title">Dodaj pracownika</h3>
                <button className="modal-close" type="button" onClick={closeModal} aria-label="Zamknij">
                  ×
                </button>
              </div>

              <form onSubmit={onCreateEmployee} className="form-grid">
                <div className="form-row">
                  <input
                    className="input-glass"
                    placeholder="Imię"
                    value={form.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    required
                  />
                  <input
                    className="input-glass"
                    placeholder="Nazwisko"
                    value={form.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <input
                    className="input-glass"
                    placeholder="Stanowisko"
                    value={form.position}
                    onChange={(e) => setField("position", e.target.value)}
                    required
                  />
                  <input
                    className="input-glass"
                    type="date"
                    value={form.hireDate}
                    onChange={(e) => setField("hireDate", e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <input
                    className="input-glass"
                    placeholder="Telefon (opcjonalnie)"
                    value={form.phoneNumber}
                    onChange={(e) => setField("phoneNumber", e.target.value)}
                  />

                  <select
                    className="select-glass"
                    value={form.hotelId}
                    onChange={(e) => setField("hotelId", e.target.value)}
                    required
                  >
                    <option value="">Wybierz hotel</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <hr className="hr-glass" />

                <div className="form-row">
                  <input
                    className="input-glass"
                    placeholder="Email (auto: imie.nazwisko@hotel.local)"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    disabled={!form.emailManual}
                    title={!form.emailManual ? "Email generuje się automatycznie (kolizje rozwiążemy numerem)" : ""}
                  />

                  <input
                    className="input-glass"
                    placeholder="Hasło"
                    type="password"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    required
                  />
                </div>

                <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, opacity: 0.9 }}>
                  <input
                    type="checkbox"
                    checked={form.emailManual}
                    onChange={(e) => setField("emailManual", e.target.checked)}
                  />
                  Wpisz email ręcznie
                </label>

                {err && <div className="panel-error">{err}</div>}

                <div className="modal-actions">
                  <button className="panel-btn ghost" type="button" onClick={closeModal} disabled={busy}>
                    Anuluj
                  </button>
                  <button className="panel-btn" type="submit" disabled={busy}>
                    {busy ? "Tworzę..." : "Utwórz"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
