import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimulatorPage } from './modules/simulator/pages/SimulatorPage';
import { CreateSimulationPage } from './modules/simulator/pages/CreateSimulationPage';
import { AdminDashboard } from './modules/admin/pages/AdminDashboard';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { RegisterPage } from './modules/auth/pages/RegisterPage';
import { ForgotPasswordPage } from './modules/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from './modules/auth/pages/ResetPasswordPage';
import { PasswordUpdatedPage } from './modules/auth/pages/PasswordUpdatedPage';
import { Layout } from './shared/components/Layout';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/password-updated" element={<PasswordUpdatedPage />} />

        {/* Página principal: formulario de simulación */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/simulator/create" element={<CreateSimulationPage />} />

        {/* Rutas con Layout */}
        <Route element={<Layout />}>
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
