import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { RegisterPage } from './modules/auth/pages/RegisterPage';
import { SimulatorPage } from './modules/simulator/pages/SimulatorPage';
import { AdminDashboard } from './modules/admin/pages/AdminDashboard';
import { Layout } from './shared/components/Layout';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route element={<Layout />}>
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
