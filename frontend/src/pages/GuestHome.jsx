import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMyReservations, getGuests, cancelReservation } from "../api/booking";
import { getHotels } from "../api/catalog";
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

function parseISOToUTC(iso) {
  if (!iso || typeof iso !== "string") return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function nightsBetween(fromISO, toISO) {
  const a = parseISOToUTC(fromISO);
  const b = parseISOToUTC(toISO);
  if (!a || !b) return "";
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  return diff >= 0 ? diff : "";
}

function moneyPLN(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (Number.isFinite(n)) return n % 1 === 0 ? String(n) : n.toFixed(2);
  return String(v);
}

function maskDocumentNumber(v) {
  if (!v) return "—";
  const s = String(v);
  const keep = 3;
  if (s.length <= keep) return "•".repeat(s.length);
  return "•".repeat(s.length - keep) + s.slice(-keep);
}

function reservationFromISO(r) {
  const v = pickField(r, ["checkInDate", "from", "startDate", "dateFrom"], "");
  return shortDate(v);
}

function ReservationDetailsModal({ reservation, hotels, onClose, onCancel }) {
  const panelRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onBackdropDown(e) {
    if (!panelRef.current) return;
    if (panelRef.current.contains(e.target)) return;
    onClose();
  }

  const id = pickField(reservation, ["id", "reservationId", "bookingId"], "?");

  const hotelId = pickField(reservation, ["hotelId", "hotel.id"], "");
  const hotelName = pickField(reservation, ["hotelName", "hotel.name", "hotel"], "");

  const catalogHotel = Array.isArray(hotels)
    ? hotels.find((h) => String(h?.id) === String(hotelId))
    : null;

  const displayHotelName =
    hotelName || catalogHotel?.name || (hotelId ? `Hotel #${hotelId}` : "Hotel");

  const displayHotelAddress =
    pickField(reservation, ["hotelAddress", "hotel.address", "address"], "") ||
    catalogHotel?.address ||
    "";

  const status = pickField(reservation, ["status", "state"], "");
  const statusUpper = String(status || "").toUpperCase();

  const from = shortDate(pickField(reservation, ["checkInDate", "from", "startDate", "dateFrom"], ""));
  const to = shortDate(pickField(reservation, ["checkOutDate", "to", "endDate", "dateTo"], ""));
  const nights = nightsBetween(from, to);
  const nightsLabel = nights !== "" ? `${nights}` : "—";

  const guests = pickField(reservation, ["guestCount", "guests", "numberOfGuests"], "");
  const totalBeds = pickField(reservation, ["totalBeds"], "");
  const guestName = pickField(reservation, ["guestFullName", "guestName"], "");
  const price = pickField(reservation, ["price", "total", "totalPrice", "clientPrice"], "");

  const mealTypeRaw = pickField(reservation, ["mealType"], "");
  const mealType = mealTypeRaw ? String(mealTypeRaw) : "Brak";

  const services = Array.isArray(reservation?.services) ? reservation.services : [];
  const rooms = Array.isArray(reservation?.rooms) ? reservation.rooms : [];

  const canCancelByStatus = !["ANULOWANE", "ZAKWATEROWANE", "WYKWATEROWANE"].includes(statusUpper);

  const checkIn = parseISOToUTC(from);
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const canCancelByDate = checkIn ? todayUTC.getTime() < checkIn.getTime() : true;

  const canCancel = canCancelByStatus && canCancelByDate;

  return (
    <div className="modal-backdrop" onMouseDown={onBackdropDown} role="dialog" aria-modal="true">
      <div className="modal-panel" ref={panelRef}>
        <div className="modal-head">
          <div className="modal-title">
            Szczegóły rezerwacji {id !== "?" ? `#${id}` : ""}
            {status ? <span className="pill">{String(status)}</span> : null}
          </div>

          <button type="button" className="modal-close" onClick={onClose} aria-label="Zamknij">
            ✕
          </button>
        </div>

        <div className="modal-sub">
          <b>{displayHotelName}</b>
          {displayHotelAddress ? <div className="muted">{displayHotelAddress}</div> : null}
        </div>

        <div className="modal-grid">
          <div className="modal-box">
            <h3 className="modal-h3">Podstawowe informacje</h3>

            <div className="kv">
              {guestName ? (
                <div className="kv-row">
                  <span className="muted">Gość</span>
                  <b>{guestName}</b>
                </div>
              ) : null}

              <div className="kv-row">
                <span className="muted">Od</span>
                <b>{from || "—"}</b>
              </div>
              <div className="kv-row">
                <span className="muted">Do</span>
                <b>{to || "—"}</b>
              </div>
              <div className="kv-row">
                <span className="muted">Liczba nocy</span>
                <b>{nightsLabel}</b>
              </div>
              <div className="kv-row">
                <span className="muted">Liczba gości</span>
                <b>{guests || "—"}</b>
              </div>
              <div className="kv-row">
                <span className="muted">Łącznie łóżek</span>
                <b>{totalBeds || "—"}</b>
              </div>
              <div className="kv-row">
                <span className="muted">Cena łączna</span>
                <b>{price !== "" ? `${moneyPLN(price)} PLN` : "—"}</b>
              </div>
            </div>
          </div>

          <div className="modal-box">
            <h3 className="modal-h3">Dodatkowe informacje</h3>

            <div className="modal-list">
              <div className="modal-list-title">Wyżywienie</div>
              <div className="kv">
                <div className="kv-row">
                  <span className="muted">Typ</span>
                  <b>{mealType}</b>
                </div>
              </div>
            </div>

            <div className="modal-list">
              <div className="modal-list-title">Usługi</div>

              {services.length === 0 ? (
                <div className="muted">Brak wykupionych usług.</div>
              ) : (
                <ul className="list">
                  {services.map((s, i) => (
                    <li key={s?.id ?? `${s?.name ?? "service"}-${i}`}>
                      <div>
                        <b>{s?.name || "Usługa"}</b>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {Array.isArray(rooms) && rooms.length > 0 ? (
              <div className="modal-list">
                <div className="modal-list-title">Szczegóły pokoi</div>
                <ul className="list">
                  {rooms.map((rr, idx) => (
                    <li key={`${rr?.roomId ?? "r"}-${idx}`}>
                      <b>{rr?.type || "Pokój"}</b>
                      {rr?.numberOfBeds !== undefined && rr?.numberOfBeds !== null ? (
                        <span className="muted"> — {rr.numberOfBeds} łóżka</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-small danger"
            onClick={() => onCancel?.(reservation)}
            disabled={!canCancel}
            title={!canCancel ? "Nie można anulować (status lub termin)." : "Anuluj rezerwację"}
          >
            Anuluj rezerwację
          </button>

          <button type="button" className="btn-small" onClick={onClose}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmCancelModal({ reservation, onClose, onConfirm, loading, error }) {
  const panelRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onBackdropDown(e) {
    if (!panelRef.current) return;
    if (panelRef.current.contains(e.target)) return;
    onClose();
  }

  const id = pickField(reservation, ["id", "reservationId", "bookingId"], "?");
  const hotelName = pickField(reservation, ["hotelName", "hotel.name", "hotel"], "Hotel");
  const from = shortDate(pickField(reservation, ["checkInDate", "from", "startDate", "dateFrom"], ""));
  const to = shortDate(pickField(reservation, ["checkOutDate", "to", "endDate", "dateTo"], ""));

  return (
    <div className="modal-backdrop" onMouseDown={onBackdropDown} role="dialog" aria-modal="true">
      <div className="modal-panel confirm-panel" ref={panelRef}>
        <div className="modal-head">
          <div className="modal-title">Potwierdź anulowanie</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Zamknij">
            ✕
          </button>
        </div>

        <div className="modal-body">
          Czy na pewno chcesz anulować rezerwację <b>{id !== "?" ? `#${id}` : ""}</b> w <b>{hotelName}</b>{" "}
          ({from} → {to})?
        </div>

        {error ? <div className="error" style={{ marginTop: 10 }}>{error}</div> : null}

        <div className="modal-actions confirm-actions">
          <button type="button" className="btn-small" onClick={onClose} disabled={loading}>
            Nie, wróć
          </button>
          <button type="button" className="btn-small danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Anuluję..." : "Tak, anuluj"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuestHome() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  const [panel, setPanel] = useState("reservations");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [reservations, setReservations] = useState([]);

  const [hotels, setHotels] = useState([]);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErr, setProfileErr] = useState("");
  const [guestProfile, setGuestProfile] = useState(null);

  const [details, setDetails] = useState(null);

  const [confirmCancel, setConfirmCancel] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelErr, setCancelErr] = useState("");

  const [showDocumentNumber, setShowDocumentNumber] = useState(false);

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (!user) nav("/login");
  }, [user]);

  const statusOptions = useMemo(() => {
    const set = new Set();
    for (const r of reservations) {
      const s = String(pickField(r, ["status", "state"], "") || "").toUpperCase();
      if (s) set.add(s);
    }
    return ["ALL", ...Array.from(set).sort()];
  }, [reservations]);

  const visibleReservations = useMemo(() => {
    const filtered = reservations.filter((r) => {
      if (statusFilter === "ALL") return true;
      const s = String(pickField(r, ["status", "state"], "") || "").toUpperCase();
      return s === statusFilter;
    });

    const withMeta = filtered.map((r, idx) => {
      const status = String(pickField(r, ["status", "state"], "") || "").toUpperCase();

      const fromISO = reservationFromISO(r);
      const fromDate = parseISOToUTC(fromISO);
      const time = fromDate ? fromDate.getTime() : Number.POSITIVE_INFINITY;

      const isCancelled = status === "ANULOWANE";

      return { r, idx, time, isCancelled };
    });

    withMeta.sort((a, b) => {
      if (a.isCancelled !== b.isCancelled) return a.isCancelled ? 1 : -1;
      if (a.time !== b.time) return a.time - b.time;
      return a.idx - b.idx;
    });

    return withMeta.map((x) => x.r);
  }, [reservations, statusFilter]);

  useEffect(() => {
    function onDocDown(e) {
      if (!open) return;
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function loadReservations() {
    setErr("");
    setLoading(true);
    try {
      const data = await getMyReservations();
      setReservations(normalizeReservations(data));
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

  async function loadHotels() {
    try {
      const list = await getHotels();
      setHotels(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Nie udało się pobrać hoteli:", e);
      setHotels([]);
    }
  }

  async function loadGuestProfile() {
    setShowDocumentNumber(false);
    setProfileErr("");
    setProfileLoading(true);
    try {
      const guestId = user?.guestId;
      if (!guestId) {
        setGuestProfile(null);
        return;
      }

      const all = await getGuests();
      const g = all.find((x) => String(x?.id) === String(guestId)) || null;
      setGuestProfile(g);

      if (!g) {
        setProfileErr("Nie znalazłam danych gościa w booking-service (brak rekordu lub inne ID).");
      }
    } catch (e) {
      console.error(e);
      setProfileErr(
        e?.response?.data?.message ||
          (typeof e?.response?.data === "string" ? e.response.data : null) ||
          e?.message ||
          "Nie udało się pobrać danych profilu."
      );
      setGuestProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      setStatusFilter("ALL");
      loadReservations();
      loadHotels();
      loadGuestProfile();
    }

  }, [user]);

  const prettyReservation = useMemo(() => {
    return (r) => {
      const id = pickField(r, ["id", "reservationId", "bookingId"], "?");
      const hotelId = pickField(r, ["hotelId", "hotel.id"], "");
      const hotelName = pickField(r, ["hotelName", "hotel.name", "hotel"], "");

      const catalogHotel = Array.isArray(hotels)
        ? hotels.find((h) => String(h?.id) === String(hotelId))
        : null;

      const hotelLabel =
        hotelName || catalogHotel?.name || (hotelId ? `Hotel #${hotelId}` : "Hotel");

      const from = pickField(r, ["checkInDate", "from", "startDate", "dateFrom"], "");
      const to = pickField(r, ["checkOutDate", "to", "endDate", "dateTo"], "");
      const guests = pickField(r, ["guestCount", "guests", "numberOfGuests"], "");
      const price = pickField(r, ["clientPrice", "total", "totalPrice", "price"], "");
      const status = pickField(r, ["status", "state"], "");

      return {
        id,
        hotelLabel,
        from: shortDate(from),
        to: shortDate(to),
        guests,
        price,
        status,
      };
    };
  }, [hotels]);

  async function doCancelConfirmed() {
    if (!confirmCancel) return;

    setCancelErr("");
    setCanceling(true);
    try {
      const id = pickField(confirmCancel, ["id", "reservationId", "bookingId"], null);
      if (!id) throw new Error("Brak ID rezerwacji.");

      await cancelReservation(id);

      setConfirmCancel(null);
      setDetails(null);

      await loadReservations();
    } catch (e) {
      console.error(e);
      setCancelErr(
        e?.response?.data?.message ||
          (typeof e?.response?.data === "string" ? e.response.data : null) ||
          e?.message ||
          "Nie udało się anulować rezerwacji."
      );
    } finally {
      setCanceling(false);
    }
  }

  return (
    <main className="guest-page">
      <div className="guest-card">
        <div className="guest-head">
          <div>
            <h1 className="guest-title">Panel użytkownika</h1>
          </div>

          <div className="guest-actions">
            <button
              className="search-btn"
              type="button"
              onClick={() => {
                if (panel === "profile") loadGuestProfile();
                else loadReservations();
              }}
              disabled={panel === "profile" ? profileLoading : loading}
            >
              {panel === "profile"
                ? profileLoading
                  ? "Odświeżam..."
                  : "Odśwież"
                : loading
                  ? "Odświeżam..."
                  : "Odśwież"}
            </button>

            <div className="right" ref={menuRef}>
              <button
                type="button"
                className="account-btn"
                onClick={() => setOpen((v) => !v)}
                aria-label="Menu konta"
              >
                <span className="avatar">👤</span>
              </button>

              {open && (
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
                          setOpen(false);
                          setPanel("profile");
                          setShowDocumentNumber(false);
                        }}
                      >
                        Moje dane
                      </button>

                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          setPanel("reservations");
                        }}
                      >
                        Moje rezerwacje
                      </button>

                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          nav("/search");
                        }}
                      >
                        Nowa rezerwacja
                      </button>

                      <div className="dropdown-sep" />

                      <button
                        className="dropdown-item danger"
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          signOut();
                          nav("/login");
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
                          setOpen(false);
                          nav("/login");
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

        {panel === "reservations" ? (
          <section className="guest-section">
            <div className="section-head">
              <h2 className="section-title">Moje rezerwacje</h2>

              {!loading && !err && reservations.length > 0 && (
                <div className="filters">
                  <label className="filter-label">
                    Status:
                    <select
                      className="filter-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s === "ALL" ? "Wszystkie" : s}
                        </option>
                      ))}
                    </select>
                  </label>

                  {statusFilter !== "ALL" && (
                    <button type="button" className="btn-small" onClick={() => setStatusFilter("ALL")}>
                      Wyczyść
                    </button>
                  )}
                </div>
              )}
            </div>

            {err && <div className="error">{err}</div>}
            {loading && <div className="info">Ładowanie rezerwacji...</div>}

            {!loading && !err && reservations.length === 0 && (
              <div className="placeholder">Nie masz jeszcze żadnych rezerwacji.</div>
            )}

            {!loading && !err && reservations.length > 0 && (
              <div className="reserv-grid">
                {visibleReservations.map((r, idx) => {
                  const meta = prettyReservation(r);
                  const key = meta.id !== "?" ? String(meta.id) : `row-${idx}`;

                  return (
                    <div key={key} className="reserv-item">
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
                          <span className="muted">Liczba osób:</span> <b>{meta.guests || "—"}</b>
                        </span>
                      </div>

                      <div className="reserv-bottom">
                        <button type="button" className="btn-small" onClick={() => setDetails(r)}>
                          Szczegóły
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="guest-section">
            <div className="section-head">
              <h2 className="section-title">Moje dane</h2>
            </div>

            {profileErr && <div className="error">{profileErr}</div>}
            {profileLoading && <div className="info">Ładowanie danych profilu...</div>}

            {!profileLoading && (
              <div className="data-grid">
                <div className="data-list">
                  <div className="data-row">
                    <span className="data-label">Imię</span>
                    <b className="data-value">{guestProfile?.firstName || "—"}</b>
                  </div>

                  <div className="data-row">
                    <span className="data-label">Nazwisko</span>
                    <b className="data-value">{guestProfile?.lastName || "—"}</b>
                  </div>

                  <div className="data-row">
                    <span className="data-label">Numer dokumentu</span>

                    <div className="doc-value">
                      <b className="data-value">
                        {showDocumentNumber
                          ? (guestProfile?.documentNumber || "—")
                          : maskDocumentNumber(guestProfile?.documentNumber)}
                      </b>

                      {guestProfile?.documentNumber ? (
                        <button
                          type="button"
                          className="btn-small"
                          onClick={() => setShowDocumentNumber((v) => !v)}
                          aria-label={showDocumentNumber ? "Ukryj numer dokumentu" : "Pokaż numer dokumentu"}
                        >
                          {showDocumentNumber ? "Ukryj" : "Pokaż"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="section-title">Dane kontaktowe:</div>

                  <div className="data-row">
                    <span className="data-label">Email:</span>
                    <b className="data-value">{user?.email || "—"}</b>
                  </div>

                  <div className="data-row">
                    <span className="data-label">Telefon:</span>
                    <b className="data-value">{guestProfile?.phoneNumber || "—"}</b>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {details && (
        <ReservationDetailsModal
          reservation={details}
          hotels={hotels}
          onClose={() => setDetails(null)}
          onCancel={(r) => {
            setCancelErr("");
            setConfirmCancel(r);
          }}
        />
      )}

      {confirmCancel && (
        <ConfirmCancelModal
          reservation={confirmCancel}
          onClose={() => {
            if (!canceling) setConfirmCancel(null);
          }}
          onConfirm={doCancelConfirmed}
          loading={canceling}
          error={cancelErr}
        />
      )}
    </main>
  );
}
