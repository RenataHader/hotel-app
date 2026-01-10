import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import { getHotels, getAvailableRooms } from "../api/catalog";

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

const LS = {
  selectedHotelId: "selectedHotelId",
  selectedHotelName: "selectedHotelName",
  search: "search",
  lastSearch: "lastSearch",
  rooms: "availableRooms",
};

function safeJsonGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AppLayout() {
  const nav = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(
    localStorage.getItem(LS.selectedHotelId) || ""
  );

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const [search, setSearch] = useState(() => {
    const saved = safeJsonGet(LS.search);
    if (saved?.from && saved?.to && saved?.guests) return saved;
    return { from: isoDate(today), to: isoDate(tomorrow), guests: "2" };
  });

  const [lastSearch, setLastSearch] = useState(() => safeJsonGet(LS.lastSearch));
  const [availableRooms, setAvailableRooms] = useState(() => safeJsonGet(LS.rooms) || []);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(LS.search, JSON.stringify(search));
    } catch {}
  }, [search]);

  useEffect(() => {
    try {
      if (lastSearch == null) localStorage.removeItem(LS.lastSearch);
      else localStorage.setItem(LS.lastSearch, JSON.stringify(lastSearch));
    } catch {}
  }, [lastSearch]);

  useEffect(() => {
    try {
      localStorage.setItem(LS.rooms, JSON.stringify(availableRooms || []));
    } catch {}
  }, [availableRooms]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const list = await getHotels();
        if (!alive) return;
        setHotels(list);

        const stored = localStorage.getItem(LS.selectedHotelId) || "";
        const storedExists = list.some((h) => String(h.id) === String(stored));

        if (stored && storedExists) {
          setSelectedHotelId(String(stored));
          return;
        }

        if (!stored && list.length > 0) {
          const first = list[0];
          setSelectedHotelId(String(first.id));
          localStorage.setItem(LS.selectedHotelId, String(first.id));
          localStorage.setItem(LS.selectedHotelName, first.name);
        } else if (list.length === 0) {
          setSelectedHotelId("");
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  function onChangeHotelId(id) {
    const next = String(id);
    setSelectedHotelId(next);

    const h = hotels.find((x) => String(x.id) === next);
    if (h) {
      localStorage.setItem(LS.selectedHotelId, String(h.id));
      localStorage.setItem(LS.selectedHotelName, h.name);
    } else {
      localStorage.setItem(LS.selectedHotelId, next);
    }

    setAvailableRooms([]);
    setRoomsError("");
    setLastSearch(null);
    localStorage.removeItem(LS.rooms);
    localStorage.removeItem(LS.lastSearch);
  }

  async function onSearchSubmit(e) {
    e.preventDefault();

    if (!selectedHotelId) {
      setRoomsError("Wybierz hotel.");
      nav("/");
      return;
    }

    const req = {
      hotelId: Number(selectedHotelId),
      from: search.from,
      to: search.to,
      guests: Number(search.guests),
      ts: Date.now(),
    };

    setLastSearch(req);
    setRoomsError("");
    setRoomsLoading(true);

    // WAŻNE: zawsze pokazujemy ekran wyników, też z login/register
    nav("/search");

    try {
      const rooms = await getAvailableRooms(req);
      setAvailableRooms(rooms);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        "Nie udało się pobrać dostępnych pokoi.";
      setAvailableRooms([]);
      setRoomsError(msg);
    } finally {
      setRoomsLoading(false);
    }
  }

  return (
    <>
      <TopBar
        hotels={hotels}
        selectedHotelId={selectedHotelId}
        onChangeHotelId={onChangeHotelId}
        onSearch={onSearchSubmit}
        search={search}
        setSearch={setSearch}
      />

      <div className="with-topbar">
        <Outlet
          context={{
            hotels,
            selectedHotelId,
            search,
            lastSearch,
            availableRooms,
            roomsLoading,
            roomsError,
            setRoomsError,
          }}
        />
      </div>
    </>
  );
}
