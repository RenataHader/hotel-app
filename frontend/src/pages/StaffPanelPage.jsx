import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/panelCommon.css";

import { getHotelCheckins, getHotelCheckouts } from "../api/booking";
import { getRooms } from "../api/catalog";
import {
  checkInReservation,
  checkOutReservation,
  createMaintenance,
  deleteMaintenance,
  getEmployees,
  getMaintenance,
  updateMaintenance,
} from "../api/operations";
import { useAuth } from "../auth/AuthContext";
import { canAccessTab } from "../utils/permissions";

const todayIso = () => new Date().toISOString().slice(0, 10);

const MAINT_STATUS = {
  REPORTED: "REPORTED",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
};

const STATUS_ORDER_CHECKIN = {
  ZAREZEROWANE: 0,
  ZAKWATEROWANE: 1,
  WYKWATEROWANE: 2,
};

const STATUS_ORDER_CHECKOUT = {
  ZAKWATEROWANE: 0,
  WYKWATEROWANE: 1,
  ZAREZEROWANE: 2,
};

function statusRank(status, map) {
  const s = String(status || "").toUpperCase();
  return map[s] ?? 99;
}

function guestSortKey(fullName) {
  const s = String(fullName || "").trim();
  if (!s) return "~~~|~~~";
  const parts = s.split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  return `${last.toLowerCase()}|${first.toLowerCase()}`;
}

function toIntOrNull(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export default function StaffPanelPage() {
  const nav = useNavigate();
  const { user, signOut } = useAuth();

  const initialView = (() => {
    const pos = (user?.position || "").toLowerCase();

    if (pos.includes("konserw")) return "maintenance_manage";

    if (pos.includes("recepc")) return "checkin";

    return "checkin";
  })();

  const [view, setView] = useState(initialView);


  const [maintenance, setMaintenance] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const today = useMemo(() => todayIso(), []);

  const [checkinsRaw, setCheckinsRaw] = useState([]);
  const [checkoutsRaw, setCheckoutsRaw] = useState([]);


  const canCheck = useMemo(() => canAccessTab(user, "checkinout"), [user]);
  const canReportMaintenance = useMemo(
    () => canAccessTab(user, "maintenance_report"),
    [user]
  );
  const canManageMaintenance = useMemo(
    () => canAccessTab(user, "maintenance"),
    [user]
  );

  const position = user?.position || "";
  const title = position.toLowerCase().includes("recepc")
    ? "Panel recepcji"
    : position.toLowerCase().includes("konserw")
    ? "Panel konserwatora"
    : "Panel pracownika";

  const [reportForm, setReportForm] = useState({
    date: todayIso(),
    roomId: "",
    description: "",
    durationInDays: "",
  });

  const [maintStatusFilter, setMaintStatusFilter] = useState("ALL");
  const [maintOnlyMine, setMaintOnlyMine] = useState(false);
  const [maintDraft, setMaintDraft] = useState({});

  useEffect(() => {
    function onDoc(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function safe(promise) {
  try {
    return await promise;
  } catch (e) {
    console.error(e);
    return null;
  }
}

  async function loadReservationsOnly(initial = false) {
    if (initial) setLoading(true);
    setErr("");
    setOk("");

    const date = todayIso();

    const [ci, co] = await Promise.all([
      safe(getHotelCheckins(date)),
      safe(getHotelCheckouts(date)),
    ]);

    setCheckinsRaw(Array.isArray(ci) ? ci : []);
    setCheckoutsRaw(Array.isArray(co) ? co : []);

    if (initial) setLoading(false);
  }


  async function loadMaintenanceOnly() {
    const m = await safe(getMaintenance());
    setMaintenance(Array.isArray(m) ? m : []);
  }

  async function loadRoomsOnly() {
    const rs = await safe(getRooms());
    setRooms(Array.isArray(rs) ? rs : []);
  }

  async function loadEmployeesOnly() {
    const emps = await safe(getEmployees());
    setEmployees(Array.isArray(emps) ? emps : []);
  }


  async function ensureDataForView(nextView) {
    if (nextView === "checkin" || nextView === "checkout") return;

    if (nextView === "maintenance_report" || nextView === "maintenance_manage") {
      await Promise.all([
        rooms.length ? Promise.resolve() : loadRoomsOnly(),
        employees.length ? Promise.resolve() : loadEmployeesOnly(),
        maintenance.length ? Promise.resolve() : loadMaintenanceOnly(),
      ]);
    }
  }

  async function refreshCurrent() {
    setErr("");
    setOk("");

    if (view === "checkin" || view === "checkout") {
      await loadReservationsOnly(false);
      return;
    }

    if (view === "maintenance_report" || view === "maintenance_manage") {
      await Promise.all([loadRoomsOnly(), loadEmployeesOnly(), loadMaintenanceOnly()]);
    }
  }


  async function reloadMaintenanceOnly() {
    try {
      const m = await getMaintenance();
      setMaintenance(Array.isArray(m) ? m : []);
    } catch (e) {
      setErr(
        e?.response?.data?.message || "Błąd pobrania zgłoszeń konserwacji."
      );
    }
  }

  useEffect(() => {
    ensureDataForView(view);
  }, [view]);


  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");
      setOk("");

      try {
        if (initialView === "checkin" || initialView === "checkout") {
          await loadReservationsOnly(false);
        } else {
          await Promise.all([loadRoomsOnly(), loadEmployeesOnly(), loadMaintenanceOnly()]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);



  useEffect(() => {
  const pos = (user?.position || "").toLowerCase();
  if (!pos) return;

  if (pos.includes("konserw") && (view === "checkin" || view === "checkout")) {
    setView("maintenance_manage");
  }

  if (pos.includes("recepc") && view === "maintenance_manage") {
    setView("checkin");
  }

}, [user?.position]);


  const employeesById = useMemo(() => {
    const m = new Map();
    (employees || []).forEach((e) => m.set(e.id, e));
    return m;
  }, [employees]);

  const roomsById = useMemo(() => {
    const m = new Map();
    (rooms || []).forEach((r) => m.set(r.id, r));
    return m;
  }, [rooms]);

  const myHotelId = user?.hotelId ?? null;

  const roomsInMyHotel = useMemo(() => {
    if (!myHotelId) return rooms;
    return (rooms || []).filter((r) => r.hotelId === myHotelId);
  }, [rooms, myHotelId]);

  const maintenanceInMyHotel = useMemo(() => {
    if (!myHotelId) return maintenance;

    return (maintenance || []).filter((m) => {
      const emp = employeesById.get(m.employeeId);
      if (!emp) return true;
      return emp.hotelId === myHotelId;
    });
  }, [maintenance, employeesById, myHotelId]);

  const maintenanceList = useMemo(() => {
    let list = [...(maintenanceInMyHotel || [])];

    if (maintStatusFilter !== "ALL") {
      list = list.filter(
        (m) =>
          String(m.status || "").toUpperCase() ===
          String(maintStatusFilter).toUpperCase()
      );
    }

    if (maintOnlyMine && user?.employeeId) {
      list = list.filter((m) => m.employeeId === user.employeeId);
    }

    list.sort((a, b) => (b.id || 0) - (a.id || 0));
    return list;
  }, [maintenanceInMyHotel, maintStatusFilter, maintOnlyMine, user?.employeeId]);

  const checkIns = useMemo(() => {
    const arr = [...(checkinsRaw || [])].filter((r) => r.status !== "ANULOWANE");

    arr.sort((a, b) => {
      const ra = statusRank(a.status, STATUS_ORDER_CHECKIN);
      const rb = statusRank(b.status, STATUS_ORDER_CHECKIN);
      if (ra !== rb) return ra - rb;

      const ga = guestSortKey(a.guestFullName);
      const gb = guestSortKey(b.guestFullName);
      const c = ga.localeCompare(gb, "pl");
      if (c !== 0) return c;

      return (a.id || 0) - (b.id || 0);
    });

    return arr;
  }, [checkinsRaw]);


  const checkOuts = useMemo(() => {
    const arr = [...(checkoutsRaw || [])].filter((r) => r.status !== "ANULOWANE");

    arr.sort((a, b) => {
      const ra = statusRank(a.status, STATUS_ORDER_CHECKOUT);
      const rb = statusRank(b.status, STATUS_ORDER_CHECKOUT);
      if (ra !== rb) return ra - rb;

      const ga = guestSortKey(a.guestFullName);
      const gb = guestSortKey(b.guestFullName);
      const c = ga.localeCompare(gb, "pl");
      if (c !== 0) return c;

      return (a.id || 0) - (b.id || 0);
    });

    return arr;
  }, [checkoutsRaw]);


  const list = useMemo(() => {
    if (view === "checkin") return checkIns;
    if (view === "checkout") return checkOuts;
    return [];
  }, [view, checkIns, checkOuts]);


  async function onCheckIn(id) {
    if (!canCheck) {
      setErr(
        "Brak uprawnień: zakwaterowanie/wykwaterowanie dostępne tylko dla stanowiska Recepcjonista."
      );
      return;
    }
    setBusyId(id);
    setErr("");
    setOk("");
    try {
      await checkInReservation(id);
      await loadReservationsOnly(false);
    } catch (e) {
      setErr(e?.response?.data?.message || "Nie udało się zrobić zakwaterować.");
    } finally {
      setBusyId(null);
    }
  }

  async function onCheckOut(id) {
    if (!canCheck) {
      setErr(
        "Brak uprawnień: zakwaterowanie/wykwaterowanie dostępne tylko dla stanowiska Recepcjonista."
      );
      return;
    }
    setBusyId(id);
    setErr("");
    setOk("");
    try {
      await checkOutReservation(id);
      await loadReservationsOnly(false);
    } catch (e) {
      setErr(e?.response?.data?.message || "Nie udało się zrobić wykwaterowania.");
    } finally {
      setBusyId(null);
    }
  }

  async function onCreateMaintenance(e) {
    e?.preventDefault?.();
    if (!canReportMaintenance) {
      setErr("Brak uprawnień: zgłoszenia usterek dostępne tylko dla recepcji.");
      return;
    }

    const roomId = Number(reportForm.roomId);
    const employeeId = user?.employeeId;

    if (!employeeId) {
      setErr("Nie mogę utworzyć zgłoszenia: brak employeeId w koncie.");
      return;
    }
    if (!roomId) {
      setErr("Wybierz pokój.");
      return;
    }

    const desc = String(reportForm.description || "").trim();
    if (desc.length < 4) {
      setErr("Wpisz krótki opis usterki (min. 4 znaki).");
      return;
    }

    setBusyId("maintenance-create");
    setErr("");
    setOk("");

    try {
      const payload = {
        date: reportForm.date || todayIso(),
        description: desc,
        status: MAINT_STATUS.REPORTED,
        durationInDays: toIntOrNull(reportForm.durationInDays),
        employeeId,
        roomId,
      };

      await createMaintenance(payload);
      setOk("Zgłoszenie zostało dodane.");
      setReportForm((f) => ({ ...f, description: "", durationInDays: "" }));
      await reloadMaintenanceOnly();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Nie udało się utworzyć zgłoszenia.");
    } finally {
      setBusyId(null);
    }
  }

  function setDraft(id, patch) {
    setMaintDraft((d) => {
      const prev = d[id] || {};
      return { ...d, [id]: { ...prev, ...patch } };
    });
  }

  function getDraft(m) {
    return {
      status: (maintDraft[m.id]?.status ?? m.status ?? "").toString(),
      durationInDays: maintDraft[m.id]?.durationInDays ?? (m.durationInDays ?? ""),
    };
  }

  async function onTakeMaintenance(m) {
    if (!canManageMaintenance) {
      setErr("Brak uprawnień: obsługa konserwacji dostępna tylko dla konserwatora.");
      return;
    }

    const employeeId = user?.employeeId;
    if (!employeeId) {
      setErr("Brak employeeId w koncie.");
      return;
    }

    setBusyId(m.id);
    setErr("");
    setOk("");

    try {
      await updateMaintenance(m.id, {
        date: m.date,
        description: m.description,
        status: MAINT_STATUS.IN_PROGRESS,
        durationInDays: m.durationInDays,
        employeeId,
        roomId: m.roomId,
      });
      setOk(`Zgłoszenie #${m.id} przyjęte do realizacji.`);
      await reloadMaintenanceOnly();
    } catch (e) {
      setErr(e?.response?.data?.message || "Nie udało się przyjąć zgłoszenia.");
    } finally {
      setBusyId(null);
    }
  }

  async function onSaveMaintenanceRow(m) {
    if (!canManageMaintenance) {
      setErr("Brak uprawnień: obsługa konserwacji dostępna tylko dla konserwatora.");
      return;
    }

    const employeeId = user?.employeeId;
    if (!employeeId) {
      setErr("Brak employeeId w koncie.");
      return;
    }

    const d = getDraft(m);
    const status = String(d.status || "").trim();
    if (!status) {
      setErr("Status nie może być pusty.");
      return;
    }

    const nextEmployeeId =
      String(m.status || "").toUpperCase() === MAINT_STATUS.REPORTED &&
      String(status).toUpperCase() === MAINT_STATUS.IN_PROGRESS
        ? employeeId
        : m.employeeId;

    setBusyId(m.id);
    setErr("");
    setOk("");

    try {
      await updateMaintenance(m.id, {
        date: m.date,
        description: m.description,
        status,
        durationInDays: toIntOrNull(d.durationInDays),
        employeeId: nextEmployeeId,
        roomId: m.roomId,
      });
      setOk(`Zapisano zmiany w zgłoszeniu #${m.id}.`);
      await reloadMaintenanceOnly();
    } catch (e) {
      setErr(e?.response?.data?.message || "Nie udało się zapisać zmian.");
    } finally {
      setBusyId(null);
    }
  }

  async function onDeleteMaintenance(m) {
    const isReceptionDelete =
      canReportMaintenance &&
      user?.employeeId &&
      m.employeeId === user.employeeId &&
      String(m.status || "").toUpperCase() === MAINT_STATUS.REPORTED;

    const canDelete = canManageMaintenance || isReceptionDelete;

    if (!canDelete) {
      setErr("Brak uprawnień do usunięcia tego zgłoszenia.");
      return;
    }

    setBusyId(`del-${m.id}`);
    setErr("");
    setOk("");

    try {
      await deleteMaintenance(m.id);
      setOk(`Usunięto zgłoszenie #${m.id}.`);
      await reloadMaintenanceOnly();
    } catch (e) {
      setErr(e?.response?.data?.message || "Nie udało się usunąć zgłoszenia.");
    } finally {
      setBusyId(null);
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
              <h2 className="panel-title">{title}</h2>
              <div className="panel-sub">
                <span style={{ marginLeft: 10 }}>
                  Dzisiaj: <span className="pill">{today}</span>
                </span>
                <span style={{ marginLeft: 10 }}>
                  Stanowisko: <span className="pill">{position || "—"}</span>
                </span>
              </div>
            </div>

            <div className="panel-toolbar">
              <button className="panel-btn" type="button" onClick={refreshCurrent}>
                Odśwież
              </button>

              <div className="panel-top-right" ref={menuRef}>
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
                          <div className="dropdown-email">
                            {user.email || "Użytkownik"}
                          </div>
                        </div>

                        <button
                          className={`dropdown-item ${!canCheck ? "disabled" : ""}`}
                          type="button"
                          disabled={!canCheck}
                          title={!canCheck ? "Dostęp tylko dla stanowiska: Recepcjonista" : ""}
                          onClick={() => {
                            if (!canCheck) return;
                            setMenuOpen(false);
                            setView("checkin");
                          }}
                        >
                          {view === "checkin" ? "✓ " : ""}Zakwaterowania na dzisiaj
                        </button>

                        <button
                          className={`dropdown-item ${!canCheck ? "disabled" : ""}`}
                          type="button"
                          disabled={!canCheck}
                          title={!canCheck ? "Dostęp tylko dla stanowiska: Recepcjonista" : ""}
                          onClick={() => {
                            if (!canCheck) return;
                            setMenuOpen(false);
                            setView("checkout");
                          }}
                        >
                          {view === "checkout" ? "✓ " : ""}Wykwaterowania na dzisiaj
                        </button>

                        <button
                          className={`dropdown-item ${!canReportMaintenance ? "disabled" : ""}`}
                          type="button"
                          disabled={!canReportMaintenance}
                          title={!canReportMaintenance ? "Dostęp tylko dla stanowiska: Recepcjonista" : ""}
                          onClick={() => {
                            if (!canReportMaintenance) return;
                            setMenuOpen(false);
                            setView("maintenance_report");
                          }}
                        >
                          {view === "maintenance_report" ? "✓ " : ""}Zgłoś usterkę
                        </button>

                        <button
                          className={`dropdown-item ${!canManageMaintenance ? "disabled" : ""}`}
                          type="button"
                          disabled={!canManageMaintenance}
                          title={!canManageMaintenance ? "Dostęp tylko dla stanowiska: Konserwator" : ""}
                          onClick={() => {
                            if (!canManageMaintenance) return;
                            setMenuOpen(false);
                            setView("maintenance_manage");
                          }}
                        >
                          {view === "maintenance_manage" ? "✓ " : ""}Konserwacje
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
                        <div className="dropdown-head">Nie jesteś zalogowany/a</div>
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
          {ok && <div className="panel-box" style={{ marginTop: 10 }}>{ok}</div>}

          {(view === "checkin" || view === "checkout") && (
            <>
              {!canCheck && (
                <div className="panel-box" style={{ marginTop: 12 }}>
                  <b>Info:</b> Zakwaterowanie / Wykwaterowanie jest dostępny tylko dla stanowiska{" "}
                  <b>Recepcjonista</b>. Twoje stanowisko: <b>{position || "—"}</b>.
                </div>
              )}

              <div className="panel-box" style={{ marginTop: 12 }}>
                <h3 className="panel-h3">
                  {view === "checkin" ? "Zakwaterowanie na dzisiaj" : "Wykwaterowanie na dzisiaj"}
                </h3>

                {list.length === 0 ? (
                  <div style={{ opacity: 0.85 }}>
                    {view === "checkin" ? "Brak zakwaterowania na dzisiaj." : "Brak wykwaterowania na dzisiaj."}
                  </div>
                ) : (
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Gość</th>
                        <th>Pokoje</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td>{r.guestFullName || "-"}</td>
                          <td>{r.roomNumber || (r.rooms?.map((x) => x.roomNumber).join(", ") ?? "-")}</td>
                          <td><span className="pill">{r.status}</span></td>
                          <td style={{ textAlign: "right" }}>
                            {view === "checkin" ? (
                              <button
                                className="panel-btn"
                                type="button"
                                disabled={
                                  !canCheck ||
                                  busyId === r.id ||
                                  r.status === "ZAKWATEROWANE" ||
                                  r.status === "WYKWATEROWANE"
                                }
                                title={!canCheck ? "Dostęp tylko dla stanowiska: Recepcjonista" : ""}
                                onClick={() => onCheckIn(r.id)}
                              >
                                {busyId === r.id ? "..." : "ZAKWATEROWANE"}
                              </button>
                            ) : (
                              <button
                                className="panel-btn"
                                type="button"
                                disabled={!canCheck || busyId === r.id || r.status === "WYKWATEROWANE"}
                                title={!canCheck ? "Dostęp tylko dla stanowiska: Recepcjonista" : ""}
                                onClick={() => onCheckOut(r.id)}
                              >
                                {busyId === r.id ? "..." : "WYKWATEROWANE"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {view === "maintenance_report" && (
            <>
              {!canReportMaintenance && (
                <div className="panel-box" style={{ marginTop: 12 }}>
                  <b>Info:</b> Zgłaszanie usterek dostępne tylko dla stanowiska <b>Recepcjonista</b>.
                  Twoje stanowisko: <b>{position || "—"}</b>.
                </div>
              )}

              <div className="panel-grid" style={{ marginTop: 12 }}>
                <div className="panel-box">
                  <h3 className="panel-h3">Zgłoś usterkę</h3>

                  <form className="form-grid" onSubmit={onCreateMaintenance}>
                    <div className="form-row">
                      <label>
                        Data zgłoszenia
                        <input
                          className="input-glass"
                          type="date"
                          value={reportForm.date}
                          onChange={(e) => setReportForm((f) => ({ ...f, date: e.target.value }))}
                        />
                      </label>

                      <label>
                        Pokój
                        <select
                          className="select-glass"
                          value={reportForm.roomId}
                          onChange={(e) => setReportForm((f) => ({ ...f, roomId: e.target.value }))}
                        >
                          <option value="">— wybierz —</option>
                          {roomsInMyHotel.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.roomNumber} — {r.type} ({r.status})
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label>
                      Opis usterki
                      <textarea
                        className="input-glass"
                        rows={4}
                        value={reportForm.description}
                        onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Np. cieknie kran / nie działa klimatyzacja / przepalona żarówka..."
                      />
                    </label>

                    <div className="form-row">
                      <label>
                        Szacowany czas (dni) — opcjonalnie
                        <input
                          className="input-glass"
                          inputMode="numeric"
                          value={reportForm.durationInDays}
                          onChange={(e) => setReportForm((f) => ({ ...f, durationInDays: e.target.value }))}
                          placeholder="np. 1"
                        />
                      </label>

                      <div style={{ display: "grid", alignItems: "end" }}>
                        <button
                          className="panel-btn"
                          type="submit"
                          disabled={!canReportMaintenance || busyId === "maintenance-create"}
                          title={!canReportMaintenance ? "Dostęp tylko dla stanowiska: Recepcjonista" : ""}
                        >
                          {busyId === "maintenance-create" ? "..." : "Dodaj zgłoszenie"}
                        </button>
                      </div>
                    </div>

                  </form>
                </div>

                <div className="panel-box">
                  <h3 className="panel-h3">Zgłoszenia (podgląd)</h3>

                  {maintenanceList.length === 0 ? (
                    <div style={{ opacity: 0.85 }}>Brak zgłoszeń.</div>
                  ) : (
                    <table className="panel-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Data</th>
                          <th>Pokój</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {maintenanceList.map((m) => {
                          const r = roomsById.get(m.roomId);
                          const canDeleteReception =
                            canReportMaintenance &&
                            user?.employeeId &&
                            m.employeeId === user.employeeId &&
                            String(m.status || "").toUpperCase() === MAINT_STATUS.REPORTED;

                          return (
                            <tr key={m.id}>
                              <td>{m.id}</td>
                              <td>{m.date}</td>
                              <td>{r ? r.roomNumber : `#${m.roomId}`}</td>
                              <td><span className="pill">{m.status}</span></td>
                              <td style={{ textAlign: "right" }}>
                                {canDeleteReception && (
                                  <button
                                    className="panel-btn ghost"
                                    type="button"
                                    disabled={busyId === `del-${m.id}`}
                                    onClick={() => onDeleteMaintenance(m)}
                                  >
                                    {busyId === `del-${m.id}` ? "..." : "Usuń"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {view === "maintenance_manage" && (
            <>
              {!canManageMaintenance && (
                <div className="panel-box" style={{ marginTop: 12 }}>
                  <b>Info:</b> Obsługa konserwacji dostępna tylko dla stanowiska <b>Konserwator</b>.
                  Twoje stanowisko: <b>{position || "—"}</b>.
                </div>
              )}

              <div className="panel-box" style={{ marginTop: 12 }}>
                <h3 className="panel-h3">Konserwacje</h3>

                <div className="form-row" style={{ marginBottom: 10 }}>
                  <label>
                    <select
                      className="select-glass"
                      value={maintStatusFilter}
                      onChange={(e) => setMaintStatusFilter(e.target.value)}
                    >
                      <option value="ALL">Wszystkie</option>
                      <option value={MAINT_STATUS.REPORTED}>REPORTED</option>
                      <option value={MAINT_STATUS.IN_PROGRESS}>IN_PROGRESS</option>
                      <option value={MAINT_STATUS.DONE}>DONE</option>
                    </select>
                  </label>

                  <label style={{ display: "flex", gap: 10, alignItems: "end" }}>
                    <input
                      type="checkbox"
                      checked={maintOnlyMine}
                      onChange={(e) => setMaintOnlyMine(e.target.checked)}
                    />
                    <span>Pokaż tylko moje</span>
                  </label>
                </div>

                {maintenanceList.length === 0 ? (
                  <div style={{ opacity: 0.85 }}>Brak zgłoszeń.</div>
                ) : (
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Data</th>
                        <th>Pokój</th>
                        <th>Opis</th>
                        <th>Przypisany</th>
                        <th>Status</th>
                        <th>Czas (dni)</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceList.map((m) => {
                        const r = roomsById.get(m.roomId);
                        const emp = employeesById.get(m.employeeId);
                        const d = getDraft(m);

                        const isReported =
                          String(m.status || "").toUpperCase() === MAINT_STATUS.REPORTED;

                        const isBusy =
                          busyId === m.id || busyId === `del-${m.id}`;

                        return (
                          <tr key={m.id}>
                            <td>{m.id}</td>
                            <td>{m.date}</td>
                            <td>{r ? r.roomNumber : `${m.roomId}`}</td>
                            <td style={{ maxWidth: 380 }}>
                              <div style={{ fontSize: 15, opacity: 0.95 }}>
                                {m.description || "—"}
                              </div>
                            </td>
                            <td>
                              {emp ? `${emp.firstName} ${emp.lastName}` : `#${m.employeeId}`}
                            </td>
                            <td>
                              <select
                                className="select-glass"
                                value={d.status}
                                disabled={!canManageMaintenance || isBusy}
                                onChange={(e) => setDraft(m.id, { status: e.target.value })}
                              >
                                <option value={MAINT_STATUS.REPORTED}>REPORTED</option>
                                <option value={MAINT_STATUS.IN_PROGRESS}>IN_PROGRESS</option>
                                <option value={MAINT_STATUS.DONE}>DONE</option>
                              </select>
                            </td>
                            <td>
                              <input
                                className="input-glass"
                                inputMode="numeric"
                                value={d.durationInDays}
                                disabled={!canManageMaintenance || isBusy}
                                onChange={(e) => setDraft(m.id, { durationInDays: e.target.value })}
                                placeholder="-"
                              />
                            </td>
                            <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              {isReported && (
                                <button
                                  className="panel-btn ghost"
                                  type="button"
                                  disabled={!canManageMaintenance || isBusy}
                                  onClick={() => onTakeMaintenance(m)}
                                  title={!canManageMaintenance ? "Dostęp tylko dla stanowiska: Konserwator" : ""}
                                >
                                  {busyId === m.id ? "..." : "Weź"}
                                </button>
                              )}

                              <button
                                className="panel-btn ghost"
                                style={{ marginLeft: 8 }}
                                type="button"
                                disabled={!canManageMaintenance || isBusy}
                                onClick={() => onDeleteMaintenance(m)}
                                title={!canManageMaintenance ? "Dostęp tylko dla stanowiska: Konserwator" : ""}
                              >
                                {busyId === `del-${m.id}` ? "..." : "Usuń"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}