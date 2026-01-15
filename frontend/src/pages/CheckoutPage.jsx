import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMeals, getServices } from "../api/catalog";
import { quoteReservation, createReservation } from "../api/booking";
import "./CheckoutPage.css";

const LS_CHECKOUT = "checkoutSelection";

function safeGetSelection() {
  try {
    const raw = localStorage.getItem(LS_CHECKOUT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function pickQuotePrice(q) {
  return q?.price ?? q?.total ?? q?.totalPrice ?? q?.clientPrice ?? null;
}

function norm(s) {
  return String(s ?? "").trim().toLowerCase();
}


function resolveMealId(prevMealId, selectionMealType, meals) {
  const arr = Array.isArray(meals) ? meals : [];
  if (arr.length === 0) return prevMealId ?? null;


  if (prevMealId != null) {
    const id = Number(prevMealId);
    if (Number.isFinite(id) && arr.some((m) => Number(m?.id) === id)) return id;
  }


  if (selectionMealType) {
    const found = arr.find((m) => norm(m?.type) === norm(selectionMealType));
    if (found?.id != null) return Number(found.id);
  }


  const brak = arr.find((m) => norm(m?.type) === "brak");
  if (brak?.id != null) return Number(brak.id);


  return arr[0]?.id != null ? Number(arr[0].id) : null;
}

function toPriceString2(v) {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number") return v.toFixed(2);
  const s = String(v).trim();
  if (!s) return undefined;

  const n = Number(s);
  if (Number.isFinite(n)) return n.toFixed(2);
  return s;
}

export default function CheckoutPage() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [selection] = useState(() => safeGetSelection());

  const [meals, setMeals] = useState([]);
  const [services, setServices] = useState([]);

  const [mealId, setMealId] = useState(() => selection?.mealId ?? null);
  const [serviceIds, setServiceIds] = useState(() => (selection?.serviceIds || []).map(Number));

  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState("");
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [creating, setCreating] = useState(false);

  const roomIds = useMemo(() => {
    const raw = selection?.roomIds ?? selection?.offer?.roomIds ?? [];
    const nums = (raw || []).map((x) => Number(x)).filter((n) => Number.isFinite(n));
    const unique = Array.from(new Set(nums));

    if (unique.length === 0 && selection?.roomId != null) {
      const id = Number(selection.roomId);
      if (Number.isFinite(id)) unique.push(id);
    }
    return unique;
  }, [selection]);

  const roomId = useMemo(() => {
    if (selection?.roomId != null) {
      const id = Number(selection.roomId);
      if (Number.isFinite(id)) return id;
    }
    return roomIds[0] ?? null;
  }, [selection, roomIds]);

  const summary = useMemo(() => {
    const o = selection?.offer;
    return {
      title: o?.title || "Oferta",
      beds: o?.totalBeds ?? "?",
      basePrice: o?.totalPricePerNight ?? "",
      roomsCount: o?.roomsCount ?? (roomIds?.length || ""),
    };
  }, [selection, roomIds]);

  const roomDescriptions = useMemo(() => {
    const parts = selection?.offer?.parts;
    if (!Array.isArray(parts) || parts.length === 0) return [];

    return parts
      .map((p) => ({
        type: p?.type || "Pokój",
        qty: Number(p?.qty || 1),
        description: String(p?.description || "").trim(),
      }))
      .filter((x) => x.description.length > 0);
  }, [selection]);


  useEffect(() => {
    if (!selection) return;

    let alive = true;
    (async () => {
      setLoadingLists(true);
      setErr("");

      try {
        const [m, s] = await Promise.all([getMeals(), getServices()]);
        if (!alive) return;

        const mealsArr = Array.isArray(m) ? m : [];
        const servicesArr = Array.isArray(s) ? s : [];

        setMeals(mealsArr);
        setServices(servicesArr);

        setMealId((prev) => resolveMealId(prev, selection?.mealType, mealsArr));
      } catch (e) {
        if (!alive) return;
        console.error(e);
        setErr(e?.message || "Nie udało się pobrać usług/wyżywienia.");
      } finally {
        if (alive) setLoadingLists(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selection]);

  useEffect(() => {
    if (!selection) return;
    const next = {
      ...selection,
      mealId,
      serviceIds,
      roomId,
      roomIds,
    };
    try {
      localStorage.setItem(LS_CHECKOUT, JSON.stringify(next));
    } catch {}
  }, [selection, mealId, serviceIds, roomId, roomIds]);

  function buildReservationRequest(clientPrice = null) {
    if (!selection?.hotelId || !selection?.checkInDate || !selection?.checkOutDate) {
      throw new Error("Brakuje danych do rezerwacji. Wróć do wyników i wybierz ofertę.");
    }
    if (!roomId || !roomIds || roomIds.length === 0) {
      throw new Error("Brakuje pokoju/pokoi. Wróć do wyników i wybierz ofertę.");
    }
    if (mealId == null) {
      throw new Error("Wybierz wyżywienie (mealId).");
    }

    return {
      hotelId: Number(selection.hotelId),

      roomId: Number(roomId),
      roomIds: roomIds.map(Number),

      guestCount: Number(selection.guestCount || 1),

      mealId: Number(mealId),
      serviceIds: (serviceIds || []).map(Number),

      checkInDate: selection.checkInDate,
      checkOutDate: selection.checkOutDate,

      clientPrice: clientPrice != null ? toPriceString2(clientPrice) : undefined,
    };
  }

  async function recalcQuote() {
    setErr("");
    setQuote(null);
    setLoadingQuote(true);

    try {
      const payload = buildReservationRequest(null);
      const q = await quoteReservation(payload);
      setQuote(q);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        e?.message ||
        "Nie udało się wyliczyć ceny (quote).";
      setErr(msg);
    } finally {
      setLoadingQuote(false);
    }
  }

  async function confirmReservation() {
    setErr("");

    if (!user) {
      nav(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }

    if (!quote) {
      alert('Najpierw kliknij „Przelicz cenę”, a potem „Zarezerwuj”.');
      return;
    }

    setCreating(true);
    try {
      const clientPrice = pickQuotePrice(quote);
      const payload = buildReservationRequest(clientPrice);
      const created = await createReservation(payload);

      //alert(`Rezerwacja utworzona! ID: ${created?.id ?? "?"}`);
      nav("/guest");
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        e?.message ||
        "Nie udało się utworzyć rezerwacji.";
      setErr(msg);
    } finally {
      setCreating(false);
    }
  }

  if (!selection) {
    return (
      <main className="checkout-main">
        <div className="checkout-card">
          <h2 className="h2">Dodatki i cena końcowa</h2>
          {err ? <div className="error">{err}</div> : null}
          <div className="placeholder">Brak wybranej oferty. Wróć do wyników wyszukiwania.</div>
          <div className="actions">
            <Link className="search-btn" to="/search">
              Wróć do wyników
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-main">
      <div className="checkout-card">
        <h2 className="h2">Dodatki i cena końcowa</h2>

        {err ? <div className="error">{err}</div> : null}

          <div className="summary">
            <div>
              <b>{summary.title}</b>
            </div>

            {roomDescriptions.length > 0 && (
              <div className="summary-rooms">
                {roomDescriptions.length === 1 ? (
                  <div className="summary-room-desc">{roomDescriptions[0].description}</div>
                ) : (
                  <ul className="summary-room-list">
                    {roomDescriptions.map((r, idx) => (
                      <li key={idx}>
                        <b>
                          {r.type}
                          {r.qty > 1 ? ` x${r.qty}` : ""}
                        </b>
                        {": "}
                        {r.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {roomDescriptions.length > 0 && <div className="summary-sep" />}

            <div className="muted">
              Termin: <b>{selection.checkInDate}</b> → <b>{selection.checkOutDate}</b> • Liczba osób:{" "}
              <b>{selection.guestCount}</b>
            </div>

            <div className="muted">
              Cena bazowa: <b>{String(summary.basePrice)} PLN</b> za noc
            </div>
          </div>


        <div className="grid">
          <div className="box">
            <h3 className="h3">Wyżywienie</h3>

            {loadingLists ? (
              <div className="info">Ładuję...</div>
            ) : (
              <select
                className="mini-input"
                value={mealId ?? ""}
                onChange={(e) => setMealId(e.target.value ? Number(e.target.value) : null)}
                disabled={meals.length === 0}
              >
                {meals.length === 0 ? (
                  <option value="">Brak pozycji w bazie</option>
                ) : (
                  meals.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.type}
                      {m.price != null ? ` • ${m.price} PLN` : ""}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          <div className="box">
            <h3 className="h3">Usługi</h3>

            {loadingLists ? (
              <div className="info">Ładuję...</div>
            ) : (
              <div className="checks">
                {services.map((s) => {
                  const id = Number(s.id);
                  const checked = serviceIds.includes(id);

                  return (
                    <label key={id} className="check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setServiceIds((prev) => {
                            const arr = (prev || []).map(Number);
                            if (e.target.checked) return Array.from(new Set([...arr, id]));
                            return arr.filter((x) => x !== id);
                          });
                        }}
                      />
                      <span>
                        {s.name ?? `Usługa #${id}`}
                        {s.price != null ? <span className="muted"> • {s.price} PLN</span> : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="actions">
          <button className="search-btn" type="button" onClick={recalcQuote} disabled={loadingQuote}>
            {loadingQuote ? "Liczenie..." : "Przelicz cenę"}
          </button>
        </div>

        {quote && (
          <div className="quote">
            <h3 className="h3">Podsumowanie kosztów</h3>

            <div className="quote-grid">
              <div className="quote-row">
                <span className="muted">Liczba nocy: </span>
                <b>{quote.nights ?? "—"}</b>
              </div>

              <div className="quote-row">
                <span className="muted">Cena za pokoje: </span>
                <b>{quote.roomsTotal != null ? `${quote.roomsTotal} PLN` : "—"}</b>
              </div>

              <div className="quote-row">
                <span className="muted">Wyżywienie: </span>
                <b>{quote.mealTotal != null ? `${quote.mealTotal} PLN` : "—"}</b>
              </div>

              <div className="quote-row">
                <span className="muted">Usługi: </span>
                <b>{quote.servicesTotal != null ? `${quote.servicesTotal} PLN` : "—"}</b>
              </div>

              <div className="quote-sep" />

              <div className="quote-row quote-total">
                <span>Razem: </span>
                <b>{quote.total != null ? `${quote.total} PLN` : "—"}</b>
              </div>
            </div>

            <div className="quote-actions">
              {!user ? (
                <>
                  <div className="muted">Aby potwierdzić rezerwację, zaloguj się lub zarejestruj.</div>
                  <div className="quote-actions-row">
                    <Link className="btn-ghost" to={`/login?next=${encodeURIComponent("/checkout")}`}>
                      Zaloguj
                    </Link>
                    <Link className="btn-ghost" to={`/register?next=${encodeURIComponent("/checkout")}`}>
                      Rejestracja
                    </Link>
                  </div>
                </>
              ) : (
                <button className="search-btn" type="button" onClick={confirmReservation} disabled={creating}>
                  {creating ? "Tworzę..." : "Zarezerwuj i zapłać"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
