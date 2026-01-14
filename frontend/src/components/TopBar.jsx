import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMeals, getServices, getRooms } from "../api/catalog";
import { groupRooms } from "../utils/groupRooms";
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

  const [showPriceList, setShowPriceList] = useState(false);
  const [priceListData, setPriceListData] = useState({ meals: [], services: [], roomGroups: [] });
  const [loadingPrices, setLoadingPrices] = useState(false);

  const today = useMemo(() => isoToday(), []);

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const openPriceList = async () => {
    setShowPriceList(true);
    setLoadingPrices(true);
    try {
      const [m, s, r] = await Promise.all([getMeals(), getServices(), getRooms()]);
      
      const hotelRooms = r.filter(room => String(room.hotelId) === String(selectedHotelId));
      const roomGroups = groupRooms(hotelRooms);
      
      setPriceListData({ meals: m, services: s, roomGroups });
    } catch (err) {
      console.error("Błąd ładowania cennika:", err);
    } finally {
      setLoadingPrices(false);
    }
  };

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
                  const minTo = v ? addDaysIso(v, 1) : addDaysIso(today, 1);

                  if (!next.to || (v && next.to <= v)) {
                    next.to = minTo;
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

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="search-btn" type="submit">
              Szukaj
            </button>
            
            <button className="search-btn" type="button" onClick={openPriceList} style={{ background: 'rgba(26, 143, 151, 0.87)', border: '1px solid rgba(255,255,255,0.2)' }}>
              Cennik
            </button>

            <button className="search-btn" type="button" onClick={() => nav("/rooms")} style={{ background: 'rgba(26, 143, 151, 0.87)', border: '1px solid rgba(255,255,255,0.2)' }}>
              Pokoje
            </button>
          </div>
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

      {showPriceList && (
        <div className="modal-backdrop" onClick={() => setShowPriceList(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(700px, 95%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-head">
              <h3 className="modal-title">Cennik usług i pokoi</h3>
              <button className="modal-close" onClick={() => setShowPriceList(false)}>×</button>
            </div>
            
            {loadingPrices ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Ładowanie danych cennika...</div>
            ) : (
              <div style={{ overflowY: 'auto', padding: '10px' }}>
                <div className="modal-grid">
                  <div className="modal-box">
                    <h4 className="panel-h3" style={{ color: '#a5b4fc', marginBottom: '12px' }}>Standard pokoi (za noc)</h4>
                    <div className="kv">
                      {priceListData.roomGroups.length > 0 ? priceListData.roomGroups.map(g => (
                        <div key={g.key} className="kv-row">
                          <span>{g.type} ({g.beds} os.)</span>
                          <b>{g.price} PLN</b>
                        </div>
                      )) : <div className="muted">Brak danych o pokojach.</div>}
                    </div>
                  </div>

                  <div className="modal-box">
                    <h4 className="panel-h3" style={{ color: '#a5b4fc', marginBottom: '12px' }}>Wyżywienie (os./doba)</h4>
                    <div className="kv">
                      {priceListData.meals.map(m => (
                        <div key={m.id} className="kv-row">
                          <span>{m.type}</span>
                          <b>{m.price} PLN</b>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="modal-box" style={{ gridColumn: '1 / -1' }}>
                    <h4 className="panel-h3" style={{ color: '#a5b4fc', marginBottom: '12px' }}>Usługi dodatkowe</h4>
                    <div className="kv" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
                      {priceListData.services.map(s => (
                        <div key={s.id} className="kv-row">
                          <span style={{ fontSize: '14px' }}>{s.name}</span>
                          <b>{s.price} PLN</b>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button className="panel-btn" onClick={() => setShowPriceList(false)}>Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}