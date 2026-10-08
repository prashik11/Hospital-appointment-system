import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Departments from "./components/Departments";
import Doctors from "./components/Doctors";
import Footer from "./components/Footer";

import Appointment from "./pages/Appointment";
import AdminAppointments from "./pages/AdminAppointments";
import AdminLogin from "./pages/AdminLogin";
import AdminManagement from "./pages/AdminManagement";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./components/ProtectedRoute";

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Services />
        <Doctors />
        <Departments />
      </main>

      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Home */}
        <Route path="/" element={<Home />} />

        {/* Public Appointment */}
        <Route path="/appointment" element={<Appointment />} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Appointments */}
        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute>
              <AdminAppointments />
            </ProtectedRoute>
          }
        />

        {/* Admin Management */}
        <Route
          path="/admin/management"
          element={
            <ProtectedRoute>
              <AdminManagement />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
