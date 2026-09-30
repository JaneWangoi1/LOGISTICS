import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Trucks from './pages/Trucks';
import TruckProfile from './pages/TruckProfile';
import Drivers from './pages/Drivers';
import DriverProfile from './pages/DriverProfile';
import Trips from './pages/Trips';
import Finances from './pages/Finances';
import Documents from './pages/Documents';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Everything below requires a valid session. AppLayout renders
              the sidebar once and the matched page inside it via <Outlet /> -
              this is the "navigation shell linking the 6 modules" piece. */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="trucks" element={<Trucks />} />
            <Route path="trucks/:id" element={<TruckProfile />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="drivers/:id" element={<DriverProfile />} />
            <Route path="trips" element={<Trips />} />
            <Route path="finances" element={<Finances />} />
            <Route path="documents" element={<Documents />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
