import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { getRooms } from "../api/catalog";
import { groupRooms } from "../utils/groupRooms";
import "./RoomsPage.css";

export default function RoomsPage() {
  const { selectedHotelId, hotels } = useOutletContext();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const hotelName = useMemo(() => {
    return hotels.find(h => String(h.id) === String(selectedHotelId))?.name || "naszego hotelu";
  }, [hotels, selectedHotelId]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getRooms();
        const filtered = data.filter(r => String(r.hotelId) === String(selectedHotelId));
        setRooms(filtered);
      } catch (e) {
        console.error("Błąd ładowania pokoi:", e);
      } finally {
        setLoading(false);
      }
    }
    if (selectedHotelId) load();
  }, [selectedHotelId]);

  const roomGroups = useMemo(() => groupRooms(rooms), [rooms]);

  if (loading) return <div className="panel-page"><div className="glass-card">Ładowanie listy pokoi...</div></div>;

  return (
    <main className="rooms-page">
      <div className="glass-card">
        <h2 className="h2">Pokoje w hotelu: {hotelName}</h2>
        <div className="rooms-grid">
          {roomGroups.map((g) => (
            <div key={g.key} className="room-type-card">
              <div className="room-image-placeholder">
                <span>Zdjęcie: {g.type}</span>
              </div>
              <div className="room-info">
                <h3>{g.type}</h3>
                <p className="room-description">
                  {rooms.find(r => r.type === g.type)?.description || "Brak opisu dla tego typu pokoju."}
                </p>
                <div className="room-meta">
                  <span>Miejsca: <b>{g.beds}</b></span>
                  <span>Cena od: <b>{g.price} PLN / noc</b></span>
                </div>
              </div>
            </div>
          ))}
          {roomGroups.length === 0 && <p className="placeholder">Brak zdefiniowanych pokoi dla tego hotelu.</p>}
        </div>
      </div>
    </main>
  );
}