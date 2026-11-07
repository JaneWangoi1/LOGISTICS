import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import NewTrip from './pages/NewTrip';
import TripProfile from './pages/TripProfile';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Documents from './pages/Documents';
import Reports from './pages/Reports';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="trucks" element={<Trucks />} />
            <Route path="trucks/:id" element={<TruckProfile />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="drivers/:id" element={<DriverProfile />} />
            <Route path="trips" element={<Trips />} />
            <Route path="trips/new" element={<NewTrip />} />
            <Route path="trips/:id" element={<TripProfile />} />
            <Route path="income" element={<Income />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="compliance" element={<Documents />} />
            <Route path="reports" element={<Reports />} />
            {/* old addresses from earlier phases keep working */}
            <Route path="documents" element={<Navigate to="/compliance" replace />} />
            <Route path="finances" element={<Navigate to="/reports" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
