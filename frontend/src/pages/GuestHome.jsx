import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMyReservations } from "../api/booking";
import "./GuestHome.css";

function shortDate(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  return String(v);
}

function normalizeReservations(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  if (typeof data === "object") {
    if (Array.isArray(data.reservations)) return data.reservations;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.data)) return data.data;
  }

  return [];
}

function pickField(r, paths, fallback = "") {
  for (const p of paths) {
    const parts = p.split(".");
    let cur = r;
    let ok = true;
    for (const part of parts) {
      if (cur && typeof cur === "object" && part in cur) cur = cur[part];
      else {
        ok = false;
        break;
      }
    }
    if (ok && cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return fallback;
}

export default function GuestHome() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [reservations, setReservations] = useState([]);
  const [usedEndpoint, setUsedEndpoint] = useState("");
  const [openId, setOpenId] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    if (!user) {
      nav("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadReservations() {
    setErr("");
    setLoading(true);
    setUsedEndpoint("");

    if (!token) {
      setErr("Brak tokenu — zaloguj się ponownie.");
      setLoading(false);
      return;
    }

    try {
      const data = await getMyReservations();


      if (typeof data === "string") {
        throw new Error("Odpowiedź nie jest JSON.");
      }

      const list = normalizeReservations(data);
      setReservations(list);
      setUsedEndpoint(endpoint);
    } catch (e) {
      console.error(e);
      setErr(
        e?.response?.data?.message ||
          (typeof e?.response?.data === "string" ? e.response.data : null) ||
          e?.message ||
          "Nie udało się pobrać Twoich rezerwacji."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function prettyReservation(r) {
    const id = pickField(r, ["id", "reservationId", "bookingId"], "?");
    const hotelName = pickField(r, ["hotelName", "hotel.name", "hotel"], "");
    const hotelId = pickField(r, ["hotelId", "hotel.id"], "");
    const from = pickField(r, ["checkInDate", "from", "startDate", "dateFrom"], "");
    const to = pickField(r, ["checkOutDate", "to", "endDate", "dateTo"], "");
    const guests = pickField(r, ["guestCount", "guests", "numberOfGuests"], "");
    const price = pickField(r, ["clientPrice", "total", "totalPrice", "price"], "");
    const status = pickField(r, ["status", "state"], "");

    return {
      id,
      hotelLabel: hotelName || (hotelId ? `Hotel #${hotelId}` : "Hotel"),
      from: shortDate(from),
      to: shortDate(to),
      guests,
      price,
      status,
    };
  }

  return (
    <main className="guest-page">
      <div className="guest-card">
        <div className="guest-head">
          <div>
            <h1 className="guest-title">Panel gościa</h1>
            <p className="guest-sub">
              Zalogowano jako: <b>{user?.email}</b>
            </p>
          </div>

          <div className="guest-actions">
            <button className="search-btn" type="button" onClick={loadReservations} disabled={loading}>
              {loading ? "Odświeżam..." : "Odśwież"}
            </button>

            <button
              className="btn-ghost"
              type="button"
              onClick={() => {
                signOut();
                nav("/login");
              }}
            >
              Wyloguj
            </button>
          </div>
        </div>

        <section className="guest-section">
          <div className="section-head">
            <h2 className="section-title">Moje rezerwacje</h2>
            {usedEndpoint && (
              <span className="section-hint">
                Źródło: <b>{usedEndpoint}</b>
              </span>
            )}
          </div>

          {err && <div className="error">{err}</div>}
          {loading && <div className="info">Ładowanie rezerwacji...</div>}

          {!loading && !err && reservations.length === 0 && (
            <div className="placeholder">Nie masz jeszcze żadnych rezerwacji.</div>
          )}

          {!loading && !err && reservations.length > 0 && (
            <div className="reserv-grid">
              {reservations.map((r, idx) => {
                const meta = prettyReservation(r);
                const key = meta.id !== "?" ? String(meta.id) : `row-${idx}`;
                const isOpen = openId === key;

                return (
                  <div key={key} className={`reserv-item ${isOpen ? "is-open" : ""}`}>
                    <div className="reserv-top">
                      <div className="reserv-title">
                        <b>{meta.hotelLabel}</b>
                        {meta.status ? <span className="pill">{String(meta.status)}</span> : null}
                      </div>

                      <div className="reserv-price">
                        {meta.price !== "" ? <b>{String(meta.price)} PLN</b> : <span className="muted">—</span>}
                      </div>
                    </div>

                    <div className="reserv-meta">
                      <span>
                        <span className="muted">Od:</span> <b>{meta.from || "—"}</b>
                      </span>
                      <span>
                        <span className="muted">Do:</span> <b>{meta.to || "—"}</b>
                      </span>
                      <span>
                        <span className="muted">Osób:</span> <b>{meta.guests || "—"}</b>
                      </span>
                      <span>
                        <span className="muted">ID:</span> <b>{String(meta.id)}</b>
                      </span>
                    </div>

                    <div className="reserv-bottom">
                      <button
                        type="button"
                        className="btn-small"
                        onClick={() => setOpenId((v) => (v === key ? null : key))}
                      >
                        {isOpen ? "Ukryj szczegóły" : "Pokaż szczegóły"}
                      </button>
                    </div>

                    {isOpen && <pre className="reserv-json">{JSON.stringify(r, null, 2)}</pre>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
