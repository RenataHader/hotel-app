import { Navigate, Route, Routes } from "react-router-dom";
import BackgroundRotator from "./components/BackgroundRotator";

import HotelSelectPage from "./pages/HotelSelectPage";
import ReservationSearchPage from "./pages/ReservationSearchPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterGuestPage from "./pages/RegisterGuestPage";
import GuestHome from "./pages/GuestHome";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

export default function App() {
  return (
    <>
      <BackgroundRotator />

      <div className="app-shell">
        <Routes>
          {/* BEZ TopBara */}
          <Route path="/" element={<HotelSelectPage />} />
          <Route element={<ProtectedRoute />}>
              <Route path="/guest" element={<GuestHome />} />
          </Route>

          {/* Z TopBarem */}
          <Route element={<AppLayout />}>
            <Route path="/search" element={<ReservationSearchPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterGuestPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
