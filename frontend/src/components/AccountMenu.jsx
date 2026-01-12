import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";


export default function AccountMenu({ title = "Panel", items = [] }) {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const role = (user?.role || "").replace(/^ROLE_/, "");

  return (
    <div className="panel-topbar">
      <div className="panel-top-left">
        <div className="panel-top-title">{title}</div>
        <div className="panel-top-sub">
          {user?.email || "Użytkownik"} {role ? <span className="pill">{role}</span> : null}
        </div>
      </div>

      <div className="panel-top-right" ref={menuRef}>
        <button
          type="button"
          className="account-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu konta"
          title="Menu"
        >
          <span className="avatar">👤</span>
        </button>

        {open && (
          <div className="dropdown">
            {user ? (
              <>
                <div className="dropdown-head">
                  Zalogowano jako
                  <div className="dropdown-email">{user.email || "Użytkownik"}</div>
                </div>

                {items.map((it, idx) => (
                  <div key={idx}>
                    {it.separatorBefore ? <div className="dropdown-sep" /> : null}

                    <button
                      className={`dropdown-item ${it.danger ? "danger" : ""}`}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        it.onClick?.();
                      }}
                    >
                      {it.label}
                    </button>
                  </div>
                ))}

                <div className="dropdown-sep" />

                <button
                  className="dropdown-item danger"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOut();
                    nav("/login", { replace: true });
                  }}
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <div className="dropdown-head">
                  Nie jesteś zalogowana
                  <div className="dropdown-email">—</div>
                </div>

                <button
                  className="dropdown-item"
                  type="button"
                  onClick={() => {
                    setOpen(false);
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
  );
}
