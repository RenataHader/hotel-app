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
  // nie znamy ReservationQuoteResponse — próbujemy bezpiecznie
  return q?.price ?? q?.total ?? q?.totalPrice ?? q?.clientPrice ?? null;
}

export default function CheckoutPage() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [selection, setSelection] = useState(() => safeGetSelection());

  const [meals, setMeals] = useState([]);
  const [services, setServices] = useState([]);

  // backend wymaga mealType NOT BLANK -> default "Brak"
  const [mealType, setMealType] = useState(() => selection?.mealType || "Brak");
  const [serviceIds, setServiceIds] = useState(() => selection?.serviceIds || []);

  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState("");
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [creating, setCreating] = useState(false);

  const roomId = selection?.roomId ?? selection?.group?.roomIds?.[0] ?? null;

  const summary = useMemo(() => {
    const g = selection?.group;
    return {
      type: g?.type || "Pokój",
      beds: g?.beds ?? "?",
      basePrice: g?.price ?? "",
      count: g?.count ?? "",
    };
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
        setMeals(m);
        setServices(s);
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

  // zapisujemy wybór na wypadek refresh
  useEffect(() => {
    if (!selection) return;
    const next = { ...selection, mealType, serviceIds, roomId };
    setSelection(next);
    try {
      localStorage.setItem(LS_CHECKOUT, JSON.stringify(next));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealType, serviceIds]);

  function buildReservationRequest(clientPrice = null) {
    if (!selection?.hotelId || !selection?.checkInDate || !selection?.checkOutDate || !roomId) {
      throw new Error("Brakuje danych do rezerwacji. Wróć do wyników i wybierz ofertę.");
    }

    return {
      hotelId: Number(selection.hotelId),
      roomId: Number(roomId),

      guestCount: Number(selection.guestCount || 1),

      // WYMAGANE przez DTO:
      mealType: String(mealType || "Brak"),
      serviceIds: (serviceIds || []).map(Number),

      checkInDate: selection.checkInDate,
      checkOutDate: selection.checkOutDate,

      // opcjonalne:
      clientPrice: clientPrice ?? undefined,
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

    // create wymaga roli GUEST -> jak nie ma usera, to login z next
    if (!user) {
      nav(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }

    if (!quote) {
      setErr("Najpierw kliknij „Przelicz cenę”.");
      return;
    }

    setCreating(true);
    try {
      const clientPrice = pickQuotePrice(quote);
      const payload = buildReservationRequest(clientPrice);
      const created = await createReservation(payload);

      alert(`Rezerwacja utworzona! ID: ${created?.id ?? "?"}`);
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

        <div className="summary">
          <div>
            <b>{summary.type}</b> • {summary.beds} łóżka
          </div>
          <div className="muted">
            Termin: <b>{selection.checkInDate}</b> → <b>{selection.checkOutDate}</b> • Osób:{" "}
            <b>{selection.guestCount}</b>
          </div>
          <div className="muted">
            Cena bazowa: <b>{String(summary.basePrice)} PLN</b> / noc • Dostępne w tej grupie:{" "}
            <b>{summary.count}</b>
          </div>
          <div className="muted">
            Wybrany pokój ID: <b>{String(roomId)}</b>
          </div>
        </div>

        {err && <div className="error">{err}</div>}

        <div className="grid">
          <div className="box">
            <h3 className="h3">Wyżywienie</h3>

            {loadingLists ? (
              <div className="info">Ładuję...</div>
            ) : (
              <select className="mini-input" value={mealType} onChange={(e) => setMealType(e.target.value)}>
                {/* Backend wymaga NotBlank -> "Brak" zamiast pustego */}
                <option value="Brak">Brak</option>
                {meals.map((m) => (
                  <option key={m.id ?? m.type} value={m.type}>
                    {m.type}
                    {m.pricePerPerson ? ` • ${m.pricePerPerson} PLN/os.` : m.price ? ` • ${m.price} PLN` : ""}
                  </option>
                ))}
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
                  const id = s.id;
                  const checked = serviceIds.includes(id);

                  return (
                    <label key={id} className="check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setServiceIds((prev) => {
                            if (e.target.checked) return [...prev, id];
                            return prev.filter((x) => x !== id);
                          });
                        }}
                      />
                      <span>
                        {s.name ?? `Usługa #${id}`}
                        {s.price ? <span className="muted"> • {s.price} PLN</span> : null}
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

          {!user ? (
            <>
              <div className="muted">Aby potwierdzić rezerwację, zaloguj się lub zarejestruj.</div>
              <Link className="btn-ghost" to={`/login?next=${encodeURIComponent("/checkout")}`}>
                Zaloguj
              </Link>
              <Link className="btn-ghost" to={`/register?next=${encodeURIComponent("/checkout")}`}>
                Rejestracja
              </Link>
            </>
          ) : (
            <button className="search-btn" type="button" onClick={confirmReservation} disabled={creating}>
              {creating ? "Tworzę..." : "Potwierdź rezerwację"}
            </button>
          )}
        </div>

        {quote && (
          <div className="quote">
            <h3 className="h3">Quote z backendu</h3>
            <pre className="reserv-json">{JSON.stringify(quote, null, 2)}</pre>
          </div>
        )}
      </div>
    </main>
  );
}
