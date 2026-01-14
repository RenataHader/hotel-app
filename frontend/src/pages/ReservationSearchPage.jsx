import { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { groupRooms } from "../utils/groupRooms";
import { buildRoomOffers } from "../utils/buildRoomOffers";
import "./ReservationSearchPage.css";

const LS_CHECKOUT = "checkoutSelection";

export default function ReservationSearchPage() {
  const nav = useNavigate();
  const { lastSearch, availableRooms, roomsLoading, roomsError } = useOutletContext();

  const guestCount = Number(lastSearch?.guests ?? 1);

  const groups = useMemo(() => groupRooms(availableRooms || []), [availableRooms]);

  const offers = useMemo(() => {
    return buildRoomOffers(groups, guestCount, 30);
  }, [groups, guestCount]);

  function pickOffer(o) {
    const selection = {
      hotelId: lastSearch?.hotelId ?? null,
      checkInDate: lastSearch?.from ?? null,
      checkOutDate: lastSearch?.to ?? null,
      guestCount: guestCount,

      roomIds: o.roomIds,
      roomId: o.roomIds?.[0] ?? null,

      mealType: "Brak",
      serviceIds: [],

      offer: o,
      ts: Date.now(),
    };

    localStorage.setItem(LS_CHECKOUT, JSON.stringify(selection));
    nav("/checkout");
  }

  return (
    <main className="reserv-main">
      <div className="glass-card">
        <h2 className="h2">Wyniki wyszukiwania</h2>

        {roomsError && <div className="error">{roomsError}</div>}
        {roomsLoading && <div className="info">Szukam dostępnych pokoi...</div>}

        {!roomsLoading && !roomsError && (!lastSearch || !lastSearch.hotelId) && (
          <div className="placeholder">Ustaw parametry i kliknij „Szukaj”.</div>
        )}

        {!roomsLoading && !roomsError && lastSearch && offers.length === 0 && (
          <div className="placeholder">
            Brak ofert, które pomieszczą <b>{guestCount}</b> osób w tym terminie.
          </div>
        )}

        {!roomsLoading && !roomsError && offers.length > 0 && (
          <div className="offers">
            {offers.map((o) => (
              <button key={o.key} type="button" className="offer-card" onClick={() => pickOffer(o)}>
                <div className="offer-top">
                  <div className="offer-title">
                    <b>{o.title}</b>
                  </div>

                  <div className="offer-price">
                    <b>{String(o.totalPricePerNight)} PLN / noc</b>
                  </div>
                </div>

                <div className="offer-meta">
                  Pokoje: <b>{o.roomsCount}</b> • Łóżka: <b>{o.totalBeds}</b>
                </div>

                {Array.isArray(o.parts) && o.parts.some((p) => String(p?.description || "").trim()) && (
                  <div className="offer-desc">
                    {o.parts.length === 1 ? (
                      <div className="offer-desc-line">{o.parts[0].description}</div>
                    ) : (
                      <ul>
                        {o.parts
                          .filter((p) => String(p?.description || "").trim())
                          .map((p, idx) => (
                            <li key={idx}>
                              <b>
                                {p.type || "Pokój"}
                                {p.qty > 1 ? ` x${p.qty}` : ""}
                              </b>
                              {": "}
                              {p.description}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="offer-select">
                  <span className="chip chip--ghost">Wybierz</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
