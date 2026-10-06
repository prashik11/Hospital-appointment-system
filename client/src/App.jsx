import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Departments from "./components/Departments";
import Footer from "./components/Footer";

import Appointment from "./pages/Appointment";
import AdminAppointments from "./pages/AdminAppointments";
import AdminLogin from "./pages/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminManagement from "./pages/AdminManagement";
import NotFound from "./pages/NotFound";

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Services />
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
        <Route path="/" element={<Home />} />

        <Route path="/appointment" element={<Appointment />} />

        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute>
              <AdminAppointments />
              <AdminManagement />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;