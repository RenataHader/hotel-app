import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function GuestHome() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>Panel gościa</h1>
      <p>Zalogowano jako: <b>{user?.email}</b></p>

      <button
        onClick={() => {
          signOut();
          nav("/login");
        }}
        style={{ padding: 10, marginTop: 10 }}
      >
        Wyloguj
      </button>
    </div>
  );
}
