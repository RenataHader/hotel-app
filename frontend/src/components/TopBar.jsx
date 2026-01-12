import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./TopBar.css";

function isoToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysIso(iso, days) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TopBar({
  hotels = [],
  selectedHotelId,
  onChangeHotelId,
  onSearch,
  search,
  setSearch,
}) {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const today = useMemo(() => isoToday(), []);

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="left">
          <div
            className="brand"
            onClick={() => nav("/search")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") nav("/search");
            }}
            role="button"
            tabIndex={0}
          >
            <div className="brand-dot" />
            <span>Hotel Booking</span>
          </div>

          <select
            className="hotel-select"
            value={selectedHotelId ?? ""}
            onChange={(e) => onChangeHotelId(e.target.value)}
            aria-label="Wybór hotelu"
          >
            {hotels.length === 0 && <option value="">Ładowanie...</option>}
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <form className="search" onSubmit={onSearch}>
          <label className="mini">
            Od
            <input
              className="mini-input"
              type="date"
              value={search.from}
              min={today}
              onChange={(e) => {
                const v = e.target.value;

                setSearch((s) => {
                  const next = { ...s, from: v };

                  if (next.to && v && next.to < v) {
                    next.to = v;
                  }

                  return next;
                });
              }}
              required
            />
          </label>

          <label className="mini">
            Do
            <input
              className="mini-input"
              type="date"
              value={search.to}
              min={search.from ? addDaysIso(search.from, 1) : addDaysIso(today, 1)}
              onChange={(e) => setSearch((s) => ({ ...s, to: e.target.value }))}
              required
            />
          </label>

          <label className="mini">
            Liczba osób
            <input
              className="mini-input"
              type="number"
              min="1"
              max="20"
              value={search.guests}
              onChange={(e) => setSearch((s) => ({ ...s, guests: e.target.value }))}
              required
            />
          </label>

          <button className="search-btn" type="submit">
            Szukaj
          </button>
        </form>

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
                    <div className="dropdown-email">{user.email || user.name || "Użytkownik"}</div>
                  </div>

                  <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          nav("/guest");
                        }}
                      >
                        Moje dane
                      </button>

                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          nav("/guest");
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
                      signOut();
                      setOpen(false);
                      nav("/login");
                    }}
                  >
                    Wyloguj
                  </button>
                </>
              ) : (
                <>
                  <div className="dropdown-head">Nie jesteś zalogowany/a</div>

                  <Link className="dropdown-link" to="/login" onClick={() => setOpen(false)}>
                    Zaloguj się
                  </Link>
                  <Link className="dropdown-link" to="/register" onClick={() => setOpen(false)}>
                    Utwórz konto
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
