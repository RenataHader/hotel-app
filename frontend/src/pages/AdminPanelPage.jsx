import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/panelCommon.css";

import { getHotels, getRooms, getRoomTypes, createRoom, deactivateRoom } from "../api/catalog";
import { getAllReservations } from "../api/booking";
import { createEmployee, getEmployees, getEmployeePositions, deleteEmployee } from "../api/operations";
import { registerEmployee } from "../api/auth";
import { useAuth } from "../auth/AuthContext";

const todayIso = () => new Date().toISOString().slice(0, 10);

function slugEmailPart(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\./, "")
    .replace(/\.$/, "");
}

function buildEmail(firstName, lastName, n = 0) {
  const f = slugEmailPart(firstName);
  const l = slugEmailPart(lastName);
  const base = [f, l].filter(Boolean).join(".");
  if (!base) return "";
  return n > 0 ? `${base}${n}@hotel.local` : `${base}@hotel.local`;
}

const RE_FIRST_NAME = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+(?: [A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)*$/;
const RE_LAST_NAME = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+$/;
const RE_POSITION = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż ]+$/;
const RE_PHONE_9 = /^\d{9}$/;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function normalizeSpaces(s) {
  return String(s || "").trim().replace(/\s+/g, " ");
}

function isAdminEmployee(emp) {
  return String(emp?.position || "").trim().toLowerCase() === "administrator";
}

export default function AdminPanelPage() {
  const nav = useNavigate();
  const { user, signOut } = useAuth();

  const [view, setView] = useState("employees");

  const [hotels, setHotels] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reservations, setReservations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [empFormBusy, setEmpFormBusy] = useState(false);
  const [roomFormBusy, setRoomFormBusy] = useState(false);

  const [hotelFilter, setHotelFilter] = useState("");
  const [positions, setPositions] = useState([]);

  const [employeeHotelFilter, setEmployeeHotelFilter] = useState("");
  const [employeePositionFilter, setEmployeePositionFilter] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [roomToDeactivate, setRoomToDeactivate] = useState(null);

  const [empConfirmOpen, setEmpConfirmOpen] = useState(false);
  const [empConfirmBusy, setEmpConfirmBusy] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    position: "",
    customPosition: "",
    useCustomPosition: false,
    hireDate: todayIso(),
    phoneNumber: "",
    hotelId: "",
    password: "",
    emailManual: false,
    email: "",
  });

  const [rooms, setRooms] = useState([]);
  const [roomHotelFilter, setRoomHotelFilter] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomModalOpen, setRoomModalOpen] = useState(false);

  const [roomForm, setRoomForm] = useState({
    hotelId: "",
    roomNumber: "",
    type: "",
    useCustomType: false,
    customType: "",
    numberOfBeds: 1,
    price: "",
    description: "",
  });


  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function setRoomField(name, value) {
    setRoomForm((f) => ({ ...f, [name]: value }));
  }

  useEffect(() => {
    function onDoc(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (form.emailManual) return;
    const next = buildEmail(form.firstName, form.lastName, 0);
    setForm((f) => ({ ...f, email: next }));
  }, [form.firstName, form.lastName, form.emailManual]);

  const hotelsById = useMemo(() => {
    const m = new Map();
    hotels.forEach((h) => m.set(h.id, h.name));
    return m;
  }, [hotels]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const okHotel =
        !employeeHotelFilter || String(emp.hotelId) === String(employeeHotelFilter);

      const okPos =
        !employeePositionFilter || String(emp.position) === String(employeePositionFilter);

      return okHotel && okPos;
    });
  }, [employees, employeeHotelFilter, employeePositionFilter]);

  const canDeleteAnyEmployee = useMemo(
  () => filteredEmployees.some((emp) => !isAdminEmployee(emp)),
  [filteredEmployees]
);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const okHotel = !roomHotelFilter || String(room.hotelId) === String(roomHotelFilter);
      const okType = !roomTypeFilter || String(room.type) === String(roomTypeFilter);
      return okHotel && okType;
    });
  }, [rooms, roomHotelFilter, roomTypeFilter]);

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const [h, e, r, pos, roomsRes, typesRes] = await Promise.all([
        getHotels(),
        getEmployees(),
        getAllReservations(),
        getEmployeePositions(),
        getRooms(),
        getRoomTypes(),
      ]);

      setHotels(Array.isArray(h) ? h : []);
      setEmployees(Array.isArray(e) ? e : []);
      setReservations(Array.isArray(r) ? r : []);

      setRooms(Array.isArray(roomsRes) ? roomsRes : []);
      setRoomTypes(Array.isArray(typesRes) ? typesRes : []);

      const raw = Array.isArray(pos) ? pos : [];
      const list = raw.filter((p) => String(p).trim().toLowerCase() !== "administrator");
      setPositions(list);

      setForm((f) => {
        if (list.length === 0) {
          return { ...f, useCustomPosition: true, position: "" };
        }

        const current = f.position || "";
        const exists = current && list.includes(current);
        return { ...f, useCustomPosition: false, position: exists ? current : (list[0] || "") };
      });
    } catch (e) {
      setErr(e?.response?.data?.message || "Błąd pobierania danych.");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadAll();
  }, []);

  const filteredReservations = useMemo(() => {
    if (!hotelFilter) return reservations;
    return reservations.filter((r) => String(r.hotelId) === String(hotelFilter));
  }, [reservations, hotelFilter]);

  function closeModal() {
    setModalOpen(false);
    setErr("");
    setOk("");
  }

  function openModal() {
    setOk("");
    setErr("");
    setModalOpen(true);
  }

  function openRoomModal() {
    setOk("");
    setErr("");
    setRoomModalOpen(true);
  }

  function closeRoomModal() {
    setRoomModalOpen(false);
    setOk("");
    setErr("");
  }

  function openEmployeeDeleteConfirm(emp) {
    setErr("");
    setOk("");
    setEmployeeToDelete(emp);
    setEmpConfirmOpen(true);
  }

  function closeEmployeeDeleteConfirm() {
    if (empConfirmBusy) return;
    setEmpConfirmOpen(false);
    setEmployeeToDelete(null);
    setErr("");
    setOk("");
  }

  function openDeactivateConfirm(room) {
    setErr("");
    setOk("");
    setRoomToDeactivate(room);
    setConfirmOpen(true);
  }

  function closeDeactivateConfirm() {
    if (confirmBusy) return;
    setConfirmOpen(false);
    setRoomToDeactivate(null);
    setErr("");
    setOk("");
  }

  async function registerWithAutoEmail({
    employeeId,
    password,
    firstName,
    lastName,
    emailFromForm,
    emailManual,
  }) {
    const manual = (emailFromForm || "").trim();
    const useManual = Boolean(manual) && emailManual;

    const tryOne = async (email) => {
      await registerEmployee({
        email,
        password,
        employeeId,
        role: "EMPLOYEE",
      });
      return email;
    };

    if (useManual) {
      return await tryOne(manual);
    }

    for (let i = 0; i <= 20; i++) {
      const email = buildEmail(firstName, lastName, i === 0 ? 0 : i);
      try {
        await tryOne(email);
        return email;
      } catch (e) {
        const status = e?.response?.status;
        const msg = e?.response?.data?.message || e?.response?.data || "";
        const isConflict =
          status === 409 ||
          String(msg).toLowerCase().includes("exists") ||
          String(msg).toLowerCase().includes("zajet") ||
          String(msg).toLowerCase().includes("already");

        if (isConflict) continue;
        throw e;
      }
    }

    throw new Error("Nie udało się wygenerować wolnego emaila (za dużo kolizji).");
  }

    async function onCreateEmployee(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    const firstName = String(form.firstName || "").trim();
    const lastName = String(form.lastName || "").trim();

    const finalPosition = form.useCustomPosition
      ? normalizeSpaces(form.customPosition)
      : normalizeSpaces(form.position);

    const phone = String(form.phoneNumber || "").trim();
    const password = String(form.password || "");

    if (!firstName || !RE_FIRST_NAME.test(firstName)) {
      setErr("Imię może zawierać tylko litery.");
      return;
    }
    if (!lastName || !RE_LAST_NAME.test(lastName)) {
      setErr("Nazwisko moze zawierać tylko litery.");
      return;
    }
    if (!finalPosition || !RE_POSITION.test(finalPosition)) {
      setErr("Stanowisko może zawirać tylko litery.");
      return;
    }
    if (!RE_PHONE_9.test(phone)) {
      setErr("Telefon musi mieć dokładnie 9 cyfr.");
      return;
    }
    if (password.length < 8) {
      setErr("Hasło musi mieć minimum 8 znaków.");
      return;
    }
    if (form.emailManual && !isValidEmail(form.email)) {
      setErr("Email ma nieprawidłowy format.");
      return;
    }

    setEmpFormBusy(true);

    try {
      const emp = await createEmployee({
        firstName,
        lastName,
        position: finalPosition,
        hireDate: form.hireDate,
        phoneNumber: phone,
        hotelId: Number(form.hotelId),
      });

      const finalEmail = await registerWithAutoEmail({
        employeeId: emp.id,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        emailFromForm: form.email,
        emailManual: form.emailManual,
      });

      setOk(`Utworzono pracownika: ${finalEmail}`);

      setForm((f) => ({
        ...f,
        firstName: "",
        lastName: "",
        phoneNumber: "",
        password: "",
        emailManual: false,
        email: "",
        hireDate: todayIso(),
        useCustomPosition: false,
        customPosition: "",
        position: positions[0] || "",
        hotelId: "",
      }));

      setModalOpen(false);
      await loadAll();
    } catch (e2) {
      console.error(e2);
      setErr(
        e2?.response?.data?.message ||
          (typeof e2?.response?.data === "string" ? e2.response.data : null) ||
          e2?.message ||
          "Nie udało się utworzyć pracownika/konta."
      );
    } finally {
      setEmpFormBusy(false);
    }
  }

  async function onCreateRoom(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    const hotelId = Number(roomForm.hotelId);
    const roomNumber = String(roomForm.roomNumber || "").trim();

    const finalType = roomForm.useCustomType
      ? normalizeSpaces(roomForm.customType)
      : normalizeSpaces(roomForm.type);

    const numberOfBeds = Number(roomForm.numberOfBeds);

    const priceStr = String(roomForm.price || "").trim().replace(",", ".");
    const priceNum = Number(priceStr);

    try {
      if (!hotelId) throw new Error("Wybierz hotel.");
      if (!roomNumber) throw new Error("Podaj numer pokoju.");
      if (!finalType) throw new Error("Wybierz typ albo wpisz nowy.");
      if (!Number.isFinite(numberOfBeds) || numberOfBeds < 1)
        throw new Error("Liczba łóżek musi być >= 1.");
      if (!priceStr || !Number.isFinite(priceNum) || priceNum <= 0)
        throw new Error("Cena musi być > 0.");

      const existsLocal = rooms.some((r) => {
        const sameHotel = String(r.hotelId) === String(hotelId);
        const sameNumber = String(r.roomNumber || "").trim() === roomNumber;
        return sameHotel && sameNumber;
      });

      if (existsLocal) {
        setErr(`Pokój o numerze ${roomNumber} już istnieje w tym hotelu.`);
        return;
      }

      setRoomFormBusy(true);

      await createRoom({
        hotelId,
        roomNumber,
        type: finalType,
        numberOfBeds,
        price: priceStr,
        description: String(roomForm.description || "").trim(),
      });

      setOk("Utworzono pokój.");

      setRoomForm({
        hotelId: "",
        roomNumber: "",
        type: "",
        useCustomType: false,
        customType: "",
        numberOfBeds: 1,
        price: "",
        description: "",
      });

      setRoomModalOpen(false);
      await loadAll();
    } catch (e2) {
      console.error(e2);

      const status = e2?.response?.status;
      const msg = e2?.response?.data?.message ?? e2?.response?.data ?? e2?.message ?? "";

      const isConflict =
        status === 409 ||
        /exists|already|duplicate|zaj[eę]t|istnieje/i.test(String(msg));

      if (isConflict) {
        setErr(`Pokój o numerze ${roomNumber} już istnieje w tym hotelu.`);
      } else {
        setErr(msg || "Nie udało się utworzyć pokoju.");
      }
    } finally {
      setRoomFormBusy(false);
    }
  }


  if (loading) {
    return (
      <div className="panel-page">
        <div className="panel-wrap">
          <div className="panel-card">Ładowanie...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-page">
      <div className="panel-wrap">
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Panel admina</h2>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="panel-btn" type="button" onClick={loadAll}>
                Odśwież
              </button>

              {view === "employees" && (
                <button className="panel-btn" type="button" onClick={openModal}>
                  + Dodaj pracownika
                </button>
              )}
              {view === "rooms" && (
                <button className="panel-btn" type="button" onClick={openRoomModal}>
                  + Dodaj pokój
                </button>
              )}

              <div className="right" ref={menuRef}>
                <button
                  type="button"
                  className="account-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Menu konta"
                >
                  <span className="avatar">👤</span>
                </button>

                {menuOpen && (
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
                            setMenuOpen(false);
                            setView("employees");
                              setOk("");
                              setErr("");
                          }}
                        >
                          {view === "employees" ? "✓ " : ""}Pracownicy
                        </button>

                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setView("reservations");
                            setOk("");
                            setErr("");
                          }}
                        >
                          {view === "reservations" ? "✓ " : ""}Rezerwacje
                        </button>

                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setView("rooms");
                            setOk("");
                            setErr("");
                          }}
                        >
                          {view === "rooms" ? "✓ " : ""}Pokoje
                        </button>

                        <div className="dropdown-sep" />

                        <button
                          className="dropdown-item danger"
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            signOut();
                            nav("/login", { replace: true });
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
                            setMenuOpen(false);
                            nav("/login", { replace: true });
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

          {err && <div className="panel-error">{err}</div>}
          {ok && (
            <div
              className="panel-box"
              style={{
                borderColor: "rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.10)",
                marginTop: 12,
              }}
            >
              {ok}
            </div>
          )}

          {view === "employees" ? (
            <section className="panel-box" style={{ marginTop: 12 }}>
              <div className="panel-head">
                <h3 className="panel-h3" style={{ margin: 0 }}>
                  Lista pracowników
                </h3>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ opacity: 0.85, fontSize: 12 }}>Hotel:</span>
                    <select
                      className="select-glass"
                      value={employeeHotelFilter}
                      onChange={(e) => setEmployeeHotelFilter(e.target.value)}
                      style={{ width: 220 }}
                    >
                      <option value="">Wszystkie</option>
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ opacity: 0.85, fontSize: 12 }}>Stanowisko:</span>
                    <select
                      className="select-glass"
                      value={employeePositionFilter}
                      onChange={(e) => setEmployeePositionFilter(e.target.value)}
                      style={{ width: 220 }}
                    >
                      <option value="">Wszystkie</option>
                      {positions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>

                  {(employeeHotelFilter || employeePositionFilter) && (
                    <button
                      className="panel-btn ghost"
                      type="button"
                      onClick={() => {
                        setEmployeeHotelFilter("");
                        setEmployeePositionFilter("");
                      }}
                    >
                      Wyczyść
                    </button>
                  )}
                </div>
              </div>


              {filteredEmployees.length === 0 ? (
                <div style={{ opacity: 0.85, marginTop: 10 }}>Brak pracowników.</div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Imię</th>
                        <th>Nazwisko</th>
                        <th>Stanowisko</th>
                        <th>Hotel</th>
                        {canDeleteAnyEmployee && <th>Usuń</th>}
                      </tr>
                    </thead>
                      <tbody>
                        {filteredEmployees.map((e) => (
                          <tr key={e.id}>
                            <td>{e.id}</td>
                            <td>{e.firstName}</td>
                            <td>{e.lastName}</td>
                            <td><span className="pill">{e.position}</span></td>
                            <td>{hotelsById.get(e.hotelId) || `hotelId=${e.hotelId}`}</td>
                              {canDeleteAnyEmployee && (
                                <td style={{ width: 140 }}>
                                  {!isAdminEmployee(e) ? (
                                    <button
                                      className="panel-btn danger sm"
                                      type="button"
                                      onClick={() => openEmployeeDeleteConfirm(e)}
                                    >
                                      Usuń
                                    </button>
                                  ) : null}
                                </td>
                              )}
                          </tr>
                        ))}
                      </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : view === "reservations" ? (
            <section className="panel-box" style={{ marginTop: 12 }}>
              <div className="panel-head">
                <h3 className="panel-h3" style={{ margin: 0 }}>
                  Rezerwacje
                </h3>

                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ opacity: 0.85, fontSize: 12 }}>Hotel:</span>
                  <select
                    className="select-glass"
                    value={hotelFilter}
                    onChange={(e) => setHotelFilter(e.target.value)}
                    style={{ width: 260 }}
                  >
                    <option value="">Wszystkie</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {filteredReservations.length === 0 ? (
                <div style={{ opacity: 0.85, marginTop: 10 }}>Brak rezerwacji.</div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Hotel</th>
                        <th>Gość</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservations.map((r) => (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td>{r.hotelName || hotelsById.get(r.hotelId) || r.hotelId}</td>
                          <td>{r.guestFullName || "-"}</td>
                          <td>{String(r.checkInDate)}</td>
                          <td>{String(r.checkOutDate)}</td>
                          <td>
                            <span className="pill">{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            ) : (
              <section className="panel-box" style={{ marginTop: 12 }}>
                <div className="panel-head">
                  <h3 className="panel-h3" style={{ margin: 0 }}>
                    Pokoje
                  </h3>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ opacity: 0.85, fontSize: 12 }}>Hotel:</span>
                      <select
                        className="select-glass"
                        value={roomHotelFilter}
                        onChange={(e) => setRoomHotelFilter(e.target.value)}
                        style={{ width: 220 }}
                      >
                        <option value="">Wszystkie</option>
                        {hotels.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ opacity: 0.85, fontSize: 12 }}>Typ:</span>
                      <select
                        className="select-glass"
                        value={roomTypeFilter}
                        onChange={(e) => setRoomTypeFilter(e.target.value)}
                        style={{ width: 220 }}
                      >
                        <option value="">Wszystkie</option>
                        {roomTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="panel-sub">
                      {filteredRooms.length} / {rooms.length}
                    </div>

                    {(roomHotelFilter || roomTypeFilter) && (
                      <button
                        className="panel-btn ghost"
                        type="button"
                        onClick={() => {
                          setRoomHotelFilter("");
                          setRoomTypeFilter("");
                        }}
                      >
                        Wyczyść
                      </button>
                    )}
                  </div>
                </div>

                {filteredRooms.length === 0 ? (
                  <div style={{ opacity: 0.85, marginTop: 10 }}>Brak pokoi.</div>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    <table className="panel-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Hotel</th>
                          <th>Nr pokoju</th>
                          <th>Typ</th>
                          <th>Łóżka</th>
                          <th>Cena</th>
                          <th>Usuń</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRooms.map((room) => (
                          <tr key={room.id}>
                            <td>{room.id}</td>
                            <td>{room.hotelName || hotelsById.get(room.hotelId) || room.hotelId}</td>
                            <td>{room.roomNumber}</td>
                            <td><span className="pill">{room.type}</span></td>
                            <td>{room.numberOfBeds}</td>
                            <td>{room.price}</td>

                            <td>
                              <button
                                className="panel-btn danger sm"
                                type="button"
                                onClick={() => openDeactivateConfirm(room)}
                              >
                                Usuń
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
        </div>

        {modalOpen && (
          <div className="modal-backdrop" onMouseDown={() => { if (!empFormBusy) closeModal(); }}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3 className="modal-title">Dodaj pracownika</h3>
                  <button
                    className="modal-close"
                    type="button"
                    onClick={closeModal}
                    aria-label="Zamknij"
                    disabled={empFormBusy}
                  >
                    ×
                  </button>
              </div>

              <form onSubmit={onCreateEmployee} className="form-grid">
                <div className="form-row">
                  <input
                    className="input-glass"
                    placeholder="Imię"
                    value={form.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    required
                  />
                  <input
                    className="input-glass"
                    placeholder="Nazwisko"
                    value={form.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    required
                  />
                </div>

                  <div className="form-row">
                    {!form.useCustomPosition ? (
                      <select
                        className="select-glass"
                        value={form.position}
                        onChange={(e) => setField("position", e.target.value)}
                        required
                      >
                        {positions.length === 0 ? (
                          <option value="">Brak stanowisk w bazie</option>
                        ) : (
                          positions.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))
                        )}
                      </select>
                    ) : (
                      <input
                        className="input-glass"
                        placeholder="Wpisz nowe stanowisko"
                        value={form.customPosition}
                        onChange={(e) => setField("customPosition", e.target.value)}
                        required
                      />
                    )}

                    <input
                      className="input-glass"
                      type="date"
                      value={form.hireDate}
                      onChange={(e) => setField("hireDate", e.target.value)}
                      required
                    />
                  </div>

                  <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, opacity: 0.9 }}>
                    <input
                      type="checkbox"
                      checked={form.useCustomPosition}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((f) => ({
                          ...f,
                          useCustomPosition: checked,
                          customPosition: checked ? f.customPosition : "",
                          position: checked ? "" : (positions[0] || f.position || ""),
                        }));
                      }}
                    />
                    Nowe stanowisko (wpisz ręcznie)
                  </label>

                    <div className="form-row">
                      <input
                        className="input-glass"
                        placeholder="Telefon (9 cyfr)"
                        value={form.phoneNumber}
                        onChange={(e) => setField("phoneNumber", e.target.value)}
                        inputMode="numeric"
                        maxLength={9}
                      />

                      <select
                        className="select-glass"
                        value={form.hotelId}
                        onChange={(e) => setField("hotelId", e.target.value)}
                        required
                      >
                        <option value="">Wybierz hotel</option>
                        {hotels.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </div>

                <hr className="hr-glass" />

                <div className="form-row">
                  <input
                    className="input-glass"
                    type="email"
                    placeholder="Email (auto: imie.nazwisko@hotel.local)"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    disabled={!form.emailManual}
                    title={!form.emailManual ? "Email generuje się automatycznie (kolizje rozwiążemy numerem)" : ""}
                  />

                  <input
                    className="input-glass"
                    placeholder="Hasło"
                    type="password"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    required
                  />
                </div>

                <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, opacity: 0.9 }}>
                  <input
                    type="checkbox"
                    checked={form.emailManual}
                    onChange={(e) => setField("emailManual", e.target.checked)}
                  />
                  Wpisz email ręcznie
                </label>

                {err && <div className="panel-error">{err}</div>}

                <div className="modal-actions">
                  <button
                    className="panel-btn ghost"
                    type="button"
                    onClick={closeModal}
                    disabled={empFormBusy}
                  >
                    Anuluj
                  </button>

                  <button className="panel-btn" type="submit" disabled={empFormBusy}>
                    {empFormBusy ? "Tworzę..." : "Utwórz"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {roomModalOpen && (
          <div className="modal-backdrop" onMouseDown={() => { if (!roomFormBusy) closeRoomModal(); }}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3 className="modal-title">Dodaj pokój</h3>
                <button className="modal-close" type="button" onClick={closeRoomModal} aria-label="Zamknij" disabled={roomFormBusy} >
                  ×
                </button>
              </div>

              <form onSubmit={onCreateRoom} className="form-grid">
                <div className="form-row">
                  <select
                    className="select-glass"
                    value={roomForm.hotelId}
                    onChange={(e) => setRoomField("hotelId", e.target.value)}
                    required
                  >
                    <option value="">Wybierz hotel</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>

                  <input
                    className="input-glass"
                    placeholder="Nr pokoju (np. 101)"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomField("roomNumber", e.target.value)}
                    required
                  />
                </div>

                <div className="form-row" style={{ alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                    {!roomForm.useCustomType ? (
                      <select
                        className="select-glass"
                        value={roomForm.type}
                        onChange={(e) => setRoomField("type", e.target.value)}
                        required
                      >
                        <option value="">Wybierz typ</option>
                        {roomTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="input-glass"
                        placeholder="Wpisz nowy typ pokoju"
                        value={roomForm.customType}
                        onChange={(e) => setRoomField("customType", e.target.value)}
                        required
                      />
                    )}

                    <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, opacity: 0.9 }}>
                      <input
                        type="checkbox"
                        checked={roomForm.useCustomType}
                        onChange={(e) => setRoomField("useCustomType", e.target.checked)}
                      />
                      Nowy typ (wpisz ręcznie)
                    </label>

                    <input
                      className="input-glass"
                      placeholder="Cena"
                      value={roomForm.price}
                      onChange={(e) => setRoomField("price", e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                    <input
                      className="input-glass"
                      type="number"
                      min={1}
                      value={roomForm.numberOfBeds}
                      onChange={(e) => setRoomField("numberOfBeds", e.target.value)}
                      required
                      placeholder="Liczba łóżek"
                    />

                    <textarea
                      className="input-glass"
                      placeholder="Opis pokoju (opcjonalnie)"
                      value={roomForm.description}
                      onChange={(e) => setRoomField("description", e.target.value)}
                      rows={3}
                      style={{ resize: "vertical" }}
                    />
                  </div>
                </div>
                
                {err && <div className="panel-error">{err}</div>}

               <div className="modal-actions">
                <button
                  className="panel-btn ghost"
                  type="button"
                  onClick={closeRoomModal}
                  disabled={roomFormBusy}
                >
                  Anuluj
                </button>

                <button className="panel-btn" type="submit" disabled={roomFormBusy}>
                  {roomFormBusy ? "Tworzę..." : "Utwórz"}
                </button>
              </div>
              </form>
            </div>
          </div>
        )}

        {confirmOpen && roomToDeactivate && (
          <div className="modal-backdrop" onMouseDown={closeDeactivateConfirm}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3 className="modal-title">Potwierdź usunięcie</h3>
                <button
                  className="modal-close"
                  type="button"
                  onClick={closeDeactivateConfirm}
                  aria-label="Zamknij"
                  disabled={confirmBusy}
                >
                  ×
                </button>
              </div>

              <div style={{ marginTop: 10, opacity: 0.95 }}>
                Czy na pewno chcesz dezaktywować pokój{" "}
                <b>{roomToDeactivate.roomNumber}</b> w hotelu{" "}
                <b>{roomToDeactivate.hotelName || hotelsById.get(roomToDeactivate.hotelId) || roomToDeactivate.hotelId}</b>?
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                Pokój zniknie z listy i nie będzie możliwy do rezerwacji.
              </div>

              {err && <div className="panel-error" style={{ marginTop: 12 }}>{err}</div>}

              <div className="modal-actions" style={{ marginTop: 14 }}>
                <button
                  className="panel-btn ghost"
                  type="button"
                  onClick={closeDeactivateConfirm}
                  disabled={confirmBusy}
                >
                  Anuluj
                </button>

                <button
                  className="panel-btn danger"
                  type="button"
                  disabled={confirmBusy}
                  onClick={async () => {
                    setConfirmBusy(true);
                    setErr("");
                    setOk("");
                    try {
                      await deactivateRoom(roomToDeactivate.id);
                      setOk("Pokój dezaktywowany.");
                      closeDeactivateConfirm();
                      await loadAll();
                    } catch (e) {
                      setErr(e?.response?.data?.message || "Nie udało się dezaktywować pokoju.");
                    } finally {
                      setConfirmBusy(false);
                    }
                  }}
                >
                  {confirmBusy ? "Usuwam..." : "Tak, usuń"}
                </button>
              </div>
            </div>
          </div>
        )}

        {empConfirmOpen && employeeToDelete && (
          <div className="modal-backdrop" onMouseDown={closeEmployeeDeleteConfirm}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3 className="modal-title">Potwierdź usunięcie</h3>
                <button
                  className="modal-close"
                  type="button"
                  onClick={closeEmployeeDeleteConfirm}
                  aria-label="Zamknij"
                  disabled={empConfirmBusy}
                >
                  ×
                </button>
              </div>

              <div style={{ marginTop: 10, opacity: 0.95 }}>
                Czy na pewno chcesz usunąć pracownika{" "}
                <b>
                  {employeeToDelete.firstName} {employeeToDelete.lastName}
                </b>{" "}
                (ID: <b>{employeeToDelete.id}</b>)?
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                Zostanie usunięty pracownik oraz jego konto logowania.
              </div>

              {err && <div className="panel-error" style={{ marginTop: 12 }}>{err}</div>}

              <div className="modal-actions" style={{ marginTop: 14 }}>
                <button
                  className="panel-btn ghost"
                  type="button"
                  onClick={closeEmployeeDeleteConfirm}
                  disabled={empConfirmBusy}
                >
                  Anuluj
                </button>

                <button
                  className="panel-btn danger"
                  type="button"
                  disabled={empConfirmBusy}
                  onClick={async () => {
                    setEmpConfirmBusy(true);
                    setErr("");
                    setOk("");
                    try {
                      await deleteEmployee(employeeToDelete.id);
                      setOk("Pracownik usunięty.");
                      closeEmployeeDeleteConfirm();
                      await loadAll();
                    } catch (e) {
                      setErr(e?.response?.data?.message || "Nie udało się usunąć pracownika.");
                    } finally {
                      setEmpConfirmBusy(false);
                    }
                  }}
                >
                  {empConfirmBusy ? "Usuwam..." : "Tak, usuń"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
