import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Ładowanie...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
