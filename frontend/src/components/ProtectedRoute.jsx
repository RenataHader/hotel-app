import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute() {
  const { token, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Ładowanie...</div>;

  if (!token) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
