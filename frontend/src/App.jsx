import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterGuestPage from "./pages/RegisterGuestPage";
import GuestHome from "./pages/GuestHome";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterGuestPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/guest" element={<GuestHome />} />
        <Route path="/" element={<Navigate to="/guest" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
