import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/panelCommon.css";

import { getHotelReservations } from "../api/booking";
import { checkInReservation, checkOutReservation } from "../api/operations";
import { useAuth } from "../auth/AuthContext";

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function StaffPanelPage() {
  const nav = useNavigate();
  const { user, signOut } = useAuth();

  const [view, setView] = useState("checkin");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const today = useMemo(() => todayIso(), []);

  useEffect(() => {
    function onDoc(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function reload() {
    setLoading(true);
    setErr("");
    try {
      const r = await getHotelReservations();
      setReservations(Array.isArray(r) ? r : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Błąd pobrania rezerwacji hotelu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const checkIns = useMemo(() => {
    return reservations.filter(
      (r) => String(r.checkInDate) === today && r.status !== "CANCELLED"
    );
  }, [reservations, today]);

  const checkOuts = useMemo(() => {
    return reservations.filter(
      (r) => String(r.checkOutDate) === today && r.status !== "CANCELLED"
    );
  }, [reservations, today]);

  const list = view === "checkin" ? checkIns : checkOuts;

  async function onCheckIn(id) {
    setBusyId(id);
    setErr("");
    try {
      await checkInReservation(id);
      await reload();
    } catch (e) {
      setErr(e?.response?.data?.message || "Nie udało się zrobić check-in.");
    } finally {
      setBusyId(null);
    }
  }

  async function onCheckOut(id) {
    setBusyId(id);
    setErr("");
    try {
      await checkOutReservation(id);
      await reload();
    } catch (e) {
      setErr(e?.response?.data?.message || "Nie udało się zrobić check-out.");
    } finally {
      setBusyId(null);
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
              <h2 className="panel-title">Panel recepcji</h2>
              <div className="panel-sub">
                <span style={{ marginLeft: 10 }}>
                  Dzisiaj: <span className="pill">{today}</span>
                </span>
              </div>
            </div>

            <div className="panel-toolbar">
              <button className="panel-btn" type="button" onClick={reload}>
                Odśwież
              </button>


              <div className="panel-top-right" ref={menuRef}>
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
                            setView("checkin");
                          }}
                        >
                          {view === "checkin" ? "✓ " : ""}Check-in na dzisiaj
                        </button>

                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setView("checkout");
                          }}
                        >
                          {view === "checkout" ? "✓ " : ""}Check-out na dzisiaj
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
                        <div className="dropdown-head">Nie jesteś zalogowany/a</div>
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

          <div className="panel-box" style={{ marginTop: 12 }}>
            <h3 className="panel-h3">
              {view === "checkin" ? "Check-in na dzisiaj" : "Check-out na dzisiaj"}
            </h3>

            {list.length === 0 ? (
              <div style={{ opacity: 0.85 }}>
                {view === "checkin"
                  ? "Brak check-in na dzisiaj."
                  : "Brak check-out na dzisiaj."}
              </div>
            ) : (
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Gość</th>
                    <th>Pokoje</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.guestFullName || "-"}</td>
                      <td>{r.roomNumber || (r.rooms?.map((x) => x.roomNumber).join(", ") ?? "-")}</td>
                      <td>
                        <span className="pill">{r.status}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {view === "checkin" ? (
                          <button
                            className="panel-btn"
                            type="button"
                            disabled={
                              busyId === r.id ||
                              r.status === "CHECKED_IN" ||
                              r.status === "CHECKED_OUT"
                            }
                            onClick={() => onCheckIn(r.id)}
                          >
                            {busyId === r.id ? "..." : "Check-in"}
                          </button>
                        ) : (
                          <button
                            className="panel-btn"
                            type="button"
                            disabled={busyId === r.id || r.status === "CHECKED_OUT"}
                            onClick={() => onCheckOut(r.id)}
                          >
                            {busyId === r.id ? "..." : "Check-out"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
