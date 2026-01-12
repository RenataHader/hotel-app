import { Route, Routes, Navigate } from "react-router-dom";
import BackgroundRotator from "./components/BackgroundRotator";

import HotelSelectPage from "./pages/HotelSelectPage";
import ReservationSearchPage from "./pages/ReservationSearchPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterGuestPage from "./pages/RegisterGuestPage";

import GuestHome from "./pages/GuestHome";
import ForbiddenPage from "./pages/ForbiddenPage";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import AppLayout from "./layouts/AppLayout";

import AdminPanelPage from "./pages/AdminPanelPage";
import StaffPanelPage from "./pages/StaffPanelPage";

export default function App() {
  return (
    <>
      <BackgroundRotator />

      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/hotels" replace />} />
          <Route path="/hotels" element={<HotelSelectPage />} />

          <Route element={<AppLayout />}>
            <Route path="/search" element={<ReservationSearchPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterGuestPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={["GUEST"]} />}>
              <Route path="/guest" element={<GuestHome />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["RECEPTIONIST", "MANAGER"]} />}>
              <Route path="/staff" element={<StaffPanelPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["ADMIN", "MANAGER"]} />}>
              <Route path="/admin" element={<AdminPanelPage />} />
            </Route>

            <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
            <Route path="/staff/*" element={<Navigate to="/staff" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
