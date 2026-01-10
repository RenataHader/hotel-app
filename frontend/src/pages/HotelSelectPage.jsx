import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import "./HotelSelectPage.css";
import { getHotels } from "../api/catalog";

export default function HotelSelectPage() {
  const nav = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);

      try {
        const list = await getHotels();
        if (!alive) return;
        setHotels(list);
      } catch (e) {
        if (!alive) return;
        console.error(e);
        setErr(e?.message || "Nie udało się pobrać listy hoteli.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  function chooseHotel(hotel) {
    localStorage.setItem("selectedHotelId", String(hotel.id));
    localStorage.setItem("selectedHotelName", hotel.name || "");
    nav("/search");
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <h1 className="auth-title">Witaj</h1>
        <p className="auth-subtitle">Wybierz hotel</p>

        {loading && <p className="hint">Ładowanie hoteli...</p>}
        {err && <div className="error">{err}</div>}

        {!loading && !err && (
          <div className="hotel-list">
            {hotels.map((h) => (
              <button
                key={h.id}
                type="button"
                className="hotel-item"
                onClick={() => chooseHotel(h)}
              >
                <div className="hotel-item__text">
                  <div className="hotel-item__name">{h.name}</div>
                  {h.address ? (
                    <div className="hotel-item__address">{h.address}</div>
                  ) : null}
                </div>
                <span className="hotel-arrow">→</span>
              </button>
            ))}

            {hotels.length === 0 && <p className="hint">Brak hoteli w bazie.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
