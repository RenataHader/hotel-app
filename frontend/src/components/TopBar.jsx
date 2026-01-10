import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./TopBar.css";

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
              onChange={(e) => setSearch((s) => ({ ...s, from: e.target.value }))}
              required
            />
          </label>

          <label className="mini">
            Do
            <input
              className="mini-input"
              type="date"
              value={search.to}
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
                    <div className="dropdown-email">{user.email}</div>
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
                    Moje rezerwacje (później)
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
