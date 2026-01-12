import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { normalizeRole, homeByRole } from "../utils/role";

export default function RoleRoute({ allowedRoles }) {
  const { token, user, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Ładowanie...</div>;

  if (!token) return <Navigate to="/login" replace />;

  if (!user) return <Navigate to="/login" replace />;

  const role = normalizeRole(user?.role);

  if (!allowedRoles.includes(role)) {
    return <Navigate to={homeByRole(role)} replace />;
  }

  return <Outlet />;
}
